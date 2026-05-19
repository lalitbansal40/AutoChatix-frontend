import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useQuery } from "@tanstack/react-query";
import { ecommerceService } from "service/ecommerce.service";

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } };
const labelSx = { fontSize: 12 };
const shrinkProps = { shrink: true, sx: labelSx };

/* ─── Catalog + Product selectors shared ─── */
const CatalogSelector = ({
  channelId,
  value,
  onChange,
}: {
  channelId: string;
  value: string;
  onChange: (id: string) => void;
}) => {
  const { data: catalogsResp, isLoading } = useQuery({
    queryKey: ["catalogs", channelId],
    queryFn: () => ecommerceService.getCatalogs(channelId),
    enabled: !!channelId,
  });
  const catalogs: any[] = catalogsResp?.catalogs || [];
  const unsupported: boolean = catalogsResp?.unsupported === true;

  if (unsupported) {
    return (
      <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
        <Typography fontSize={12} color="#92400e" fontWeight={600}>⚠️ Catalogs not supported</Typography>
        <Typography fontSize={11} color="#78350f" mt={0.5} lineHeight={1.5}>
          This channel's WhatsApp account is SMB type. Upgrade to Enterprise on Meta Business Manager to use catalogs.
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth size="small">
      <InputLabel shrink sx={labelSx}>Catalog *</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label="Catalog *"
        sx={{ borderRadius: "8px", fontSize: 13 }}
        displayEmpty
        notched
      >
        <MenuItem value="" disabled sx={{ fontSize: 13 }}>
          {isLoading ? "Loading catalogs…" : "Select a catalog"}
        </MenuItem>
        {catalogs.map((cat: any) => (
          <MenuItem key={cat.id} value={cat.id} sx={{ fontSize: 13 }}>
            📦 {cat.name || cat.id}
          </MenuItem>
        ))}
      </Select>
      {!isLoading && catalogs.length === 0 && channelId && (
        <Typography fontSize={11} color="#dc2626" mt={0.5}>
          No catalogs linked to this channel. Go to E-Commerce → Products to link one.
        </Typography>
      )}
    </FormControl>
  );
};

const ProductSelector = ({
  channelId,
  catalogId,
  value,
  onChange,
  label = "Product (Retailer ID) *",
}: {
  channelId: string;
  catalogId: string;
  value: string;
  onChange: (retailerId: string, product?: any) => void;
  label?: string;
}) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", channelId, catalogId],
    queryFn: () => ecommerceService.getProducts(channelId, catalogId, { limit: 100 }),
    select: (res: any) => res.products || [],
    enabled: !!channelId && !!catalogId,
  });

  return (
    <FormControl fullWidth size="small">
      <InputLabel shrink sx={labelSx}>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => {
          const retailerId = e.target.value;
          const product = products.find(
            (p: any) => (p.retailer_id || p.id) === retailerId,
          );
          onChange(retailerId, product);
        }}
        label={label}
        sx={{ borderRadius: "8px", fontSize: 13 }}
        displayEmpty
        notched
        disabled={!catalogId}
      >
        <MenuItem value="" disabled sx={{ fontSize: 13 }}>
          {!catalogId
            ? "Select a catalog first"
            : isLoading
            ? "Loading products…"
            : "Select a product"}
        </MenuItem>
        {products.map((p: any) => (
          <MenuItem key={p.retailer_id || p.id} value={p.retailer_id || p.id} sx={{ fontSize: 13 }}>
            🛒 {p.name} {p.retailer_id ? `(${p.retailer_id})` : ""}
          </MenuItem>
        ))}
      </Select>
      {!isLoading && catalogId && products.length === 0 && (
        <Typography fontSize={11} color="#dc2626" mt={0.5}>
          No products in this catalog. Add products from E-Commerce → Products.
        </Typography>
      )}
    </FormControl>
  );
};

/* ════════════════════════════════════════════
   SINGLE PRODUCT EDITOR
════════════════════════════════════════════ */
const SingleProductEditor = ({
  node,
  updateNodeData,
  channelId,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
  channelId: string;
}) => {
  const data = node.data || {};

  const upd = (patch: Record<string, any>) =>
    updateNodeData(node.id, { ...data, ...patch });

  const handleCatalogChange = (catalogId: string) => {
    upd({ catalog_id: catalogId, product_retailer_id: "" });
  };

  return (
    <Stack spacing={2.5}>
      <Alert severity="info" sx={{ fontSize: 12, borderRadius: "8px" }}>
        Send a single product card from your WhatsApp catalog. The customer can add it to cart and submit an order.
      </Alert>

      {!channelId && (
        <Alert severity="warning" sx={{ fontSize: 12, borderRadius: "8px" }}>
          Channel not detected. Save the automation and reopen to use dropdowns.
        </Alert>
      )}

      <CatalogSelector
        channelId={channelId}
        value={data.catalog_id || ""}
        onChange={handleCatalogChange}
      />

      <ProductSelector
        channelId={channelId}
        catalogId={data.catalog_id || ""}
        value={data.product_retailer_id || ""}
        onChange={(v, product) =>
          upd({
            product_retailer_id: v,
            product_name: product?.name || v,
          })
        }
      />

      <TextField
        fullWidth size="small" label="Body Message"
        value={data.body || ""}
        onChange={(e) => upd({ body: e.target.value })}
        multiline rows={2}
        placeholder="Check out this product 👇"
        sx={fieldSx} InputLabelProps={shrinkProps}
      />

      <TextField
        fullWidth size="small" label="Footer (optional)"
        value={data.footer || ""}
        onChange={(e) => upd({ footer: e.target.value })}
        placeholder="e.g. Tap to view details"
        sx={fieldSx} InputLabelProps={shrinkProps}
      />

      {data.catalog_id && data.product_retailer_id && (
        <Box sx={{ p: 1.5, bgcolor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          <Typography fontSize={11} fontWeight={700} color="#065f46" mb={0.5}>Configured</Typography>
          <Typography fontSize={11.5} color="#374151">
            Catalog ID: <code style={{ fontSize: 11 }}>{data.catalog_id}</code>
          </Typography>
          <Typography fontSize={11.5} color="#374151">
            Product SKU: <code style={{ fontSize: 11 }}>{data.product_retailer_id}</code>
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

/* ════════════════════════════════════════════
   PRODUCT LIST EDITOR
════════════════════════════════════════════ */
const ProductListEditor = ({
  node,
  updateNodeData,
  channelId,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
  channelId: string;
}) => {
  const data = node.data || {};

  const sections: Array<{ title: string; rows: Array<{ product_retailer_id: string; product_name?: string }> }> =
    Array.isArray(data.sections) && data.sections.length > 0
      ? data.sections
      : [{ title: "Featured", rows: [{ product_retailer_id: "", product_name: "" }] }];

  const upd = (patch: Record<string, any>) =>
    updateNodeData(node.id, { ...data, ...patch });

  const handleCatalogChange = (catalogId: string) => {
    upd({
      catalog_id: catalogId,
      sections: sections.map((s) => ({ ...s, rows: s.rows.map(() => ({ product_retailer_id: "", product_name: "" })) })),
    });
  };

  const updateSections = (next: typeof sections) => upd({ sections: next });

  const addSection = () =>
    updateSections([...sections, { title: "", rows: [{ product_retailer_id: "", product_name: "" }] }]);

  const removeSection = (si: number) =>
    updateSections(sections.filter((_, i) => i !== si));

  const updateSectionTitle = (si: number, title: string) => {
    const next = sections.map((s, i) => (i === si ? { ...s, title } : s));
    updateSections(next);
  };

  const addRow = (si: number) => {
    const next = sections.map((s, i) =>
      i === si ? { ...s, rows: [...s.rows, { product_retailer_id: "", product_name: "" }] } : s
    );
    updateSections(next);
  };

  const removeRow = (si: number, ri: number) => {
    const next = sections.map((s, i) =>
      i === si ? { ...s, rows: s.rows.filter((_, j) => j !== ri) } : s
    );
    updateSections(next);
  };

  const updateRow = (si: number, ri: number, retailerId: string, product?: any) => {
    const next = sections.map((s, i) =>
      i === si
        ? {
            ...s,
            rows: s.rows.map((r, j) =>
              j === ri
                ? {
                    ...r,
                    product_retailer_id: retailerId,
                    product_name: product?.name || retailerId,
                  }
                : r,
            ),
          }
        : s
    );
    updateSections(next);
  };

  return (
    <Stack spacing={2.5}>
      <Alert severity="info" sx={{ fontSize: 12, borderRadius: "8px" }}>
        Send a multi-product message with sections. Customer browses and adds products to cart.
      </Alert>

      {!channelId && (
        <Alert severity="warning" sx={{ fontSize: 12, borderRadius: "8px" }}>
          Channel not detected. Save and reopen to use dropdowns.
        </Alert>
      )}

      <CatalogSelector
        channelId={channelId}
        value={data.catalog_id || ""}
        onChange={handleCatalogChange}
      />

      <TextField
        fullWidth size="small" label="Header (optional)"
        value={data.header || ""}
        onChange={(e) => upd({ header: e.target.value })}
        placeholder="Our Products"
        sx={fieldSx} InputLabelProps={shrinkProps}
      />

      <TextField
        fullWidth size="small" label="Body Message *"
        value={data.body || ""}
        onChange={(e) => upd({ body: e.target.value })}
        multiline rows={2}
        placeholder="Browse our products 👇"
        sx={fieldSx} InputLabelProps={shrinkProps}
      />

      <TextField
        fullWidth size="small" label="Footer (optional)"
        value={data.footer || ""}
        onChange={(e) => upd({ footer: e.target.value })}
        placeholder="e.g. Tap any item to view"
        sx={fieldSx} InputLabelProps={shrinkProps}
      />

      <Divider />

      {/* Sections */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontSize={13} fontWeight={700} color="#374151">Product Sections</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addSection}
          sx={{ textTransform: "none", fontSize: 12, color: "#db2777" }}>
          Add Section
        </Button>
      </Stack>

      {sections.map((section, si) => (
        <Box key={si} sx={{ border: "1px solid #e5e7eb", borderRadius: "10px", p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <TextField
              size="small" label="Section Title" value={section.title}
              onChange={(e) => updateSectionTitle(si, e.target.value)}
              placeholder={`Section ${si + 1}`}
              sx={{ ...fieldSx, flex: 1 }} InputLabelProps={shrinkProps}
            />
            {sections.length > 1 && (
              <IconButton size="small" onClick={() => removeSection(si)}
                sx={{ color: "#dc2626", "&:hover": { bgcolor: "#fef2f2" } }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>

          <Stack spacing={1.5}>
            {section.rows.map((row, ri) => (
              <Stack key={ri} direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1 }}>
                  <ProductSelector
                    channelId={channelId}
                    catalogId={data.catalog_id || ""}
                    value={row.product_retailer_id}
                    onChange={(v, product) => updateRow(si, ri, v, product)}
                    label={`Product ${ri + 1}`}
                  />
                </Box>
                {section.rows.length > 1 && (
                  <IconButton size="small" onClick={() => removeRow(si, ri)}
                    sx={{ color: "#dc2626", "&:hover": { bgcolor: "#fef2f2" } }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            ))}
          </Stack>

          <Button size="small" startIcon={<AddIcon />} onClick={() => addRow(si)}
            sx={{ mt: 1, textTransform: "none", fontSize: 12, color: "#db2777" }}>
            Add Product
          </Button>
        </Box>
      ))}
    </Stack>
  );
};

/* ════════════════════════════════════════════
   MAIN EXPORT — routes by node type
════════════════════════════════════════════ */
const ProductNodeEditor = ({
  node,
  updateNodeData,
  channelId,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
  channelId: string;
}) => {
  const type = node?.data?.type;

  if (type === "single_product") {
    return <SingleProductEditor node={node} updateNodeData={updateNodeData} channelId={channelId} />;
  }
  if (type === "product_list") {
    return <ProductListEditor node={node} updateNodeData={updateNodeData} channelId={channelId} />;
  }
  return null;
};

export default ProductNodeEditor;
