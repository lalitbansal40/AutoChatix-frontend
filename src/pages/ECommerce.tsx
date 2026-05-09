import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LinkIcon from "@mui/icons-material/Link";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { channelService } from "service/channel.service";
import { ecommerceService } from "service/ecommerce.service";
import { useNavigate } from "react-router-dom";

/* ─── helpers ─── */

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function calcOrderTotal(order: any) {
  const items: any[] = order?.payload?.order?.product_items || order?.payload?.product_items || [];
  const total = items.reduce((s: number, i: any) => s + Number(i.item_price) * Number(i.quantity || 1), 0);
  const currency = items[0]?.currency || "INR";
  return { total, currency, itemCount: items.reduce((s: number, i: any) => s + Number(i.quantity || 1), 0), items };
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "BDT", "PKR"];
const AVAILABILITY_OPTIONS = ["in stock", "out of stock", "preorder", "available for order", "discontinued"];
const CONDITION_OPTIONS = ["new", "refurbished", "used"];
const AGE_GROUP_OPTIONS = ["", "newborn", "infant", "toddler", "kids", "adult"];
const GENDER_OPTIONS = ["", "male", "female", "unisex"];

const EMPTY_FORM = {
  retailer_id: "", name: "", description: "", availability: "in stock",
  condition: "new", price: "", currency: "INR", image_url: "", url: "",
  brand: "", category: "", item_group_id: "", color: "", size: "",
  material: "", pattern: "", age_group: "", gender: "",
  quantity_to_sell_on_facebook: "",
};

/* ─── Create Catalog Dialog ─── */
const CreateCatalogDialog = ({ open, channelId, onClose, onSuccess }: any) => {
  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [needBusinessId, setNeedBusinessId] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setName(""); setBusinessId(""); setNeedBusinessId(false); setError(""); };

  const mutation = useMutation({
    mutationFn: () => ecommerceService.createCatalog(channelId, name.trim(), businessId.trim() || undefined),
    onSuccess: () => { onSuccess(); onClose(); reset(); },
    onError: (e: any) => {
      const data = e?.response?.data;
      if (data?.need_business_id) {
        setNeedBusinessId(true);
        setError("Auto-detect failed. Please enter your Meta Business ID below.");
      } else {
        setError(data?.message || "Failed to create catalog");
      }
    },
  });

  const handleClose = () => { onClose(); reset(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Create New Catalog
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8, color: "#6b7280" }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography fontSize={12.5} color="#6b7280" mb={2}>
          A new Meta product catalog will be created and linked to this WhatsApp channel.
        </Typography>
        {error && <Alert severity={needBusinessId ? "warning" : "error"} sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField
            autoFocus fullWidth size="small" label="Catalog Name" value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          {needBusinessId && (
            <TextField
              fullWidth size="small" label="Meta Business ID" value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="e.g. 123456789012345"
              helperText="Find in Meta Business Suite → Settings → Business info → Business ID"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} size="small" sx={{ textTransform: "none", color: "#6b7280" }}>Cancel</Button>
        <Button
          variant="contained" size="small"
          disabled={!name.trim() || (needBusinessId && !businessId.trim()) || mutation.isPending}
          onClick={() => mutation.mutate()}
          sx={{ textTransform: "none", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" }, borderRadius: "8px" }}
        >
          {mutation.isPending ? "Creating…" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Link Catalog Dialog ─── */
const LinkCatalogDialog = ({ open, channelId, onClose, onSuccess }: any) => {
  const [catalogId, setCatalogId] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => ecommerceService.linkCatalog(channelId, catalogId.trim()),
    onSuccess: () => { onSuccess(); onClose(); setCatalogId(""); setError(""); },
    onError: (e: any) => setError(e?.response?.data?.message || "Failed to link catalog"),
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Link Existing Catalog
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, color: "#6b7280" }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography fontSize={12.5} color="#6b7280" mb={2}>
          Enter the Meta Catalog ID from your{" "}
          <strong>Meta Business Manager → Commerce Manager</strong>.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}
        <TextField
          autoFocus fullWidth size="small" label="Catalog ID" value={catalogId}
          onChange={(e) => setCatalogId(e.target.value)}
          placeholder="e.g. 1234567890123456"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ textTransform: "none", color: "#6b7280" }}>Cancel</Button>
        <Button
          variant="contained" size="small" disabled={!catalogId.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
          sx={{ textTransform: "none", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" }, borderRadius: "8px" }}
        >
          {mutation.isPending ? "Linking…" : "Link Catalog"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Product Form Dialog ─── */
const ProductFormDialog = ({ open, channelId, catalogId, product, onClose, onSuccess }: any) => {
  const isEdit = !!product;
  const [form, setForm] = useState<typeof EMPTY_FORM>(() =>
    product ? {
      retailer_id: product.retailer_id || "",
      name: product.name || "",
      description: product.description || "",
      availability: product.availability || "in stock",
      condition: product.condition || "new",
      price: product.price ? String(Math.round(Number(product.price) / 100)) : "",
      currency: product.currency || "INR",
      image_url: product.image_url || "",
      url: product.url || "",
      brand: product.brand || "",
      category: product.category || "",
      item_group_id: product.item_group_id || "",
      color: product.color || "",
      size: product.size || "",
      material: product.material || "",
      pattern: product.pattern || "",
      age_group: product.age_group || "",
      gender: product.gender || "",
      quantity_to_sell_on_facebook: product.quantity_to_sell_on_facebook != null ? String(product.quantity_to_sell_on_facebook) : "",
    } : { ...EMPTY_FORM }
  );
  const [formTab, setFormTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const set = (field: string) => (e: any) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingImage(true);
    setUploadError("");
    try {
      const result = await ecommerceService.uploadProductImage(file);
      setForm((f) => ({ ...f, image_url: result.url }));
      setErrors((errs) => ({ ...errs, image_url: false }));
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || "Upload failed. Try again or enter URL manually.");
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    const required = ["retailer_id", "name", "description", "price", "currency", "image_url", "url"];
    const errs: Record<string, boolean> = {};
    required.forEach((k) => { if (!form[k as keyof typeof form]) errs[k] = true; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => {
    const payload: Record<string, any> = { ...form };
    // Convert price from major units to minor units (paise/cents)
    payload.price = Math.round(Number(form.price) * 100);
    if (form.quantity_to_sell_on_facebook) payload.quantity_to_sell_on_facebook = Number(form.quantity_to_sell_on_facebook);
    // Remove empty strings
    Object.keys(payload).forEach((k) => { if (payload[k] === "") delete payload[k]; });
    return payload;
  };

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? ecommerceService.updateProduct(channelId, catalogId, product.id, buildPayload())
      : ecommerceService.addProduct(channelId, catalogId, buildPayload()),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || "Failed to save product";
      setApiError(msg);
    },
  });

  const handleSubmit = () => {
    if (!validate()) { setFormTab(0); return; }
    setApiError("");
    mutation.mutate();
  };

  const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } };
  const labelSx = { fontSize: 12 };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
        {isEdit ? "Edit Product" : "Add New Product"}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, color: "#6b7280" }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      {/* Form tabs */}
      <Box sx={{ borderBottom: "1px solid #e5e7eb", px: 3 }}>
        <Tabs value={formTab} onChange={(_, v) => setFormTab(v)}
          sx={{ "& .MuiTab-root": { fontSize: 12, fontWeight: 600, textTransform: "none", minHeight: 40, py: 0 }, "& .Mui-selected": { color: "#065f46" }, "& .MuiTabs-indicator": { bgcolor: "#065f46" } }}>
          <Tab label="Basic Info" />
          <Tab label="Pricing" />
          <Tab label="Variants" />
          <Tab label="Images" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {apiError && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{apiError}</Alert>}

        {/* Tab 0: Basic Info */}
        {formTab === 0 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5}>
              <TextField fullWidth size="small" label="SKU / Retailer ID *" value={form.retailer_id}
                onChange={set("retailer_id")} error={errors.retailer_id} disabled={isEdit}
                helperText={isEdit ? "SKU cannot be changed" : errors.retailer_id ? "Required" : ""}
                sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
              <TextField fullWidth size="small" label="Brand" value={form.brand}
                onChange={set("brand")} sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
            </Stack>
            <TextField fullWidth size="small" label="Product Name *" value={form.name}
              onChange={set("name")} error={errors.name} helperText={errors.name ? "Required" : ""}
              sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
            <TextField fullWidth size="small" label="Description *" value={form.description}
              onChange={set("description")} error={errors.description} helperText={errors.description ? "Required" : ""}
              multiline rows={3} sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
            <TextField fullWidth size="small" label="Google Product Category" value={form.category}
              onChange={set("category")} placeholder="e.g. Apparel & Accessories > Clothing"
              sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
            <TextField fullWidth size="small" label="Product URL *" value={form.url}
              onChange={set("url")} error={errors.url} helperText={errors.url ? "Required" : "Use your website URL or a placeholder"}
              sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
          </Stack>
        )}

        {/* Tab 1: Pricing */}
        {formTab === 1 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5}>
              <TextField fullWidth size="small" label="Price *" value={form.price}
                onChange={set("price")} type="number" error={errors.price}
                helperText={errors.price ? "Required" : "Enter in major units (e.g. ₹100 = 100)"}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={12} color="#6b7280">{form.currency}</Typography></InputAdornment> }}
                sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={labelSx}>Currency</InputLabel>
                <Select value={form.currency} onChange={set("currency")} label="Currency"
                  sx={{ borderRadius: "8px", fontSize: 13 }}>
                  {CURRENCIES.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={labelSx}>Availability *</InputLabel>
                <Select value={form.availability} onChange={set("availability")} label="Availability *"
                  sx={{ borderRadius: "8px", fontSize: 13 }}>
                  {AVAILABILITY_OPTIONS.map((a) => <MenuItem key={a} value={a} sx={{ fontSize: 13 }}>{a}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel sx={labelSx}>Condition *</InputLabel>
                <Select value={form.condition} onChange={set("condition")} label="Condition *"
                  sx={{ borderRadius: "8px", fontSize: 13 }}>
                  {CONDITION_OPTIONS.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField fullWidth size="small" label="Stock Quantity" value={form.quantity_to_sell_on_facebook}
              onChange={set("quantity_to_sell_on_facebook")} type="number"
              helperText="Leave empty to not set inventory"
              sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
          </Stack>
        )}

        {/* Tab 2: Variants */}
        {formTab === 2 && (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ fontSize: 12 }}>
              Group product variants (e.g. different sizes/colors) by setting the same <strong>Item Group ID</strong>. Each variant is a separate product with its own SKU.
            </Alert>
            <TextField fullWidth size="small" label="Item Group ID" value={form.item_group_id}
              onChange={set("item_group_id")} placeholder="e.g. SHIRT-001"
              helperText="Same value for all variants of the same product"
              sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
            <Stack direction="row" spacing={1.5}>
              <TextField fullWidth size="small" label="Color" value={form.color}
                onChange={set("color")} placeholder="e.g. Red, Navy Blue"
                sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
              <TextField fullWidth size="small" label="Size" value={form.size}
                onChange={set("size")} placeholder="e.g. S, M, L, XL, 42"
                sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <TextField fullWidth size="small" label="Material" value={form.material}
                onChange={set("material")} placeholder="e.g. Cotton, Polyester"
                sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
              <TextField fullWidth size="small" label="Pattern" value={form.pattern}
                onChange={set("pattern")} placeholder="e.g. Solid, Striped, Floral"
                sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={labelSx}>Age Group</InputLabel>
                <Select value={form.age_group} onChange={set("age_group")} label="Age Group"
                  sx={{ borderRadius: "8px", fontSize: 13 }}>
                  {AGE_GROUP_OPTIONS.map((a) => <MenuItem key={a} value={a} sx={{ fontSize: 13 }}>{a || "— None —"}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel sx={labelSx}>Gender</InputLabel>
                <Select value={form.gender} onChange={set("gender")} label="Gender"
                  sx={{ borderRadius: "8px", fontSize: 13 }}>
                  {GENDER_OPTIONS.map((g) => <MenuItem key={g} value={g} sx={{ fontSize: 13 }}>{g || "— None —"}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        )}

        {/* Tab 3: Images */}
        {formTab === 3 && (
          <Stack spacing={2}>
            {/* Upload zone */}
            <Box
              component="label"
              htmlFor="product-image-input"
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "2px dashed", borderColor: errors.image_url ? "#dc2626" : uploadingImage ? "#065f46" : "#d1d5db",
                borderRadius: "12px", p: 3, cursor: uploadingImage ? "default" : "pointer", bgcolor: "#fafafa",
                "&:hover": uploadingImage ? {} : { borderColor: "#065f46", bgcolor: "#f0fdf4" },
                transition: "all 0.15s", minHeight: 160,
              }}
            >
              <input id="product-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                hidden disabled={uploadingImage} onChange={handleImageUpload} />
              {uploadingImage ? (
                <Stack alignItems="center" spacing={1}>
                  <CircularProgress size={32} sx={{ color: "#065f46" }} />
                  <Typography fontSize={13} color="#6b7280">Uploading image…</Typography>
                </Stack>
              ) : form.image_url ? (
                <Stack alignItems="center" spacing={1} width="100%">
                  <Box sx={{ maxHeight: 200, overflow: "hidden", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <img src={form.image_url} alt="product preview"
                      style={{ display: "block", maxHeight: 200, maxWidth: "100%", objectFit: "contain" }}
                      onError={(e: any) => { e.target.style.display = "none"; }} />
                  </Box>
                  <Typography fontSize={11.5} color="#6b7280">Click to change image</Typography>
                </Stack>
              ) : (
                <Stack alignItems="center" spacing={0.75}>
                  <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: "#9ca3af" }} />
                  <Typography fontSize={13} fontWeight={600} color="#374151">Click to upload product image</Typography>
                  <Typography fontSize={11.5} color="#9ca3af">JPEG, PNG, WEBP · Max 5MB · Min 500×500px recommended</Typography>
                  {errors.image_url && <Typography fontSize={12} color="#dc2626">Image is required</Typography>}
                </Stack>
              )}
            </Box>

            {uploadError && <Alert severity="error" sx={{ fontSize: 12 }}>{uploadError}</Alert>}

            {/* Manual URL fallback */}
            <TextField fullWidth size="small" label="Or enter image URL manually" value={form.image_url}
              onChange={set("image_url")} error={errors.image_url}
              helperText={errors.image_url ? "Image URL is required" : "Paste a publicly accessible image URL"}
              sx={fieldSx} InputLabelProps={{ sx: labelSx }} />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} size="small" sx={{ textTransform: "none", color: "#6b7280" }}>Cancel</Button>
        <Button variant="outlined" size="small"
          onClick={() => setFormTab((t) => Math.max(0, t - 1))} disabled={formTab === 0}
          sx={{ textTransform: "none", borderRadius: "8px", display: formTab === 0 ? "none" : undefined }}>
          Back
        </Button>
        {formTab < 3 ? (
          <Button variant="contained" size="small" onClick={() => setFormTab((t) => t + 1)}
            sx={{ textTransform: "none", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" }, borderRadius: "8px" }}>
            Next
          </Button>
        ) : (
          <Button variant="contained" size="small" onClick={handleSubmit} disabled={mutation.isPending}
            sx={{ textTransform: "none", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" }, borderRadius: "8px" }}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/* ─── Product Card ─── */
const ProductCard = ({ product, channelId, catalogId, onEdit, onDelete }: any) => {
  const price = product.price ? (Number(product.price) / 100).toFixed(2) : null;
  const isAvailable = !product.availability || product.availability === "in stock";
  const hasVariants = !!product.item_group_id;

  const variantChips = [product.color, product.size, product.material, product.pattern]
    .filter(Boolean).join(" · ");

  const deleteMutation = useMutation({
    mutationFn: () => ecommerceService.deleteProduct(channelId, catalogId, product.id),
    onSuccess: onDelete,
  });

  return (
    <Card sx={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", height: "100%", display: "flex", flexDirection: "column", position: "relative", "&:hover .product-actions": { opacity: 1 } }}>
      {/* Action overlay */}
      <Box className="product-actions" sx={{ position: "absolute", top: 6, right: 6, opacity: 0, transition: "opacity 0.15s", display: "flex", gap: 0.5, zIndex: 2 }}>
        <Tooltip title="Edit product">
          <IconButton size="small" onClick={() => onEdit(product)}
            sx={{ bgcolor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", "&:hover": { bgcolor: "#f0fdf4" }, width: 28, height: 28 }}>
            <EditOutlinedIcon sx={{ fontSize: 14, color: "#065f46" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete product">
          <IconButton size="small" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
            sx={{ bgcolor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", "&:hover": { bgcolor: "#fef2f2" }, width: 28, height: 28 }}>
            {deleteMutation.isPending
              ? <CircularProgress size={12} />
              : <DeleteOutlineIcon sx={{ fontSize: 14, color: "#dc2626" }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Variant badge */}
      {hasVariants && (
        <Chip label="Variant" size="small" sx={{ position: "absolute", top: 6, left: 6, height: 18, fontSize: 9.5, fontWeight: 700, color: "#1d4ed8", bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "5px", zIndex: 2 }} />
      )}

      {product.image_url ? (
        <CardMedia component="img" height="140" image={product.image_url} alt={product.name} sx={{ objectFit: "cover" }} />
      ) : (
        <Box sx={{ height: 140, bgcolor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography fontSize={40}>📦</Typography>
        </Box>
      )}

      <CardContent sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography fontSize={13} fontWeight={700} color="#111827"
          sx={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {product.name}
        </Typography>

        {product.description && (
          <Typography fontSize={11.5} color="#6b7280" mt={0.5}
            sx={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {product.description}
          </Typography>
        )}

        {variantChips && (
          <Typography fontSize={10.5} color="#9ca3af" mt={0.5}>{variantChips}</Typography>
        )}

        <Box sx={{ mt: "auto", pt: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
            {price && (
              <Typography fontSize={14} fontWeight={800} color="#065f46">
                {product.currency || "₹"} {price}
              </Typography>
            )}
            <Chip
              label={product.availability || "in stock"}
              size="small"
              sx={{ height: 18, fontSize: 10, fontWeight: 700, borderRadius: "5px",
                color: isAvailable ? "#065f46" : "#dc2626",
                bgcolor: isAvailable ? "#ecfdf5" : "#fef2f2",
                border: `1px solid ${isAvailable ? "#bbf7d0" : "#fecaca"}` }} />
          </Stack>
          {product.retailer_id && (
            <Typography fontSize={10.5} color="#9ca3af" mt={0.25}>SKU: {product.retailer_id}</Typography>
          )}
          {product.brand && (
            <Typography fontSize={10.5} color="#9ca3af">Brand: {product.brand}</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/* ─── Products Tab ─── */
const ProductsTab = () => {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data: channelsData = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (res: any) => res.data || [],
  });

  const { data: catalogsData = [], isLoading: catalogsLoading } = useQuery({
    queryKey: ["catalogs", selectedChannel],
    queryFn: () => ecommerceService.getCatalogs(selectedChannel),
    select: (res: any) => res.catalogs || [],
    enabled: !!selectedChannel,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", selectedChannel, selectedCatalog],
    queryFn: () => ecommerceService.getProducts(selectedChannel, selectedCatalog, { limit: 50 }),
    select: (res: any) => res.products || [],
    enabled: !!selectedChannel && !!selectedCatalog,
  });

  const products: any[] = productsData || [];

  const handleSync = async () => {
    setSyncing(true);
    await queryClient.invalidateQueries({ queryKey: ["products", selectedChannel, selectedCatalog] });
    await queryClient.invalidateQueries({ queryKey: ["catalogs", selectedChannel] });
    setSyncing(false);
  };

  const handleCatalogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["catalogs", selectedChannel] });
  };

  const handleProductSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["products", selectedChannel, selectedCatalog] });
  };

  return (
    <Box>
      {/* Channel + Catalog + Actions row */}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1.5} mb={3} flexWrap="wrap">
        <TextField select size="small" label="Select Channel" value={selectedChannel}
          onChange={(e) => { setSelectedChannel(e.target.value); setSelectedCatalog(""); }}
          sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}>
          <MenuItem value="">— Choose a channel —</MenuItem>
          {channelsData.map((ch: any) => (
            <MenuItem key={ch._id} value={ch._id} sx={{ fontSize: 13 }}>📱 {ch.channel_name || ch.display_phone_number}</MenuItem>
          ))}
        </TextField>

        {selectedChannel && (
          <TextField select size="small" label="Select Catalog" value={selectedCatalog}
            onChange={(e) => setSelectedCatalog(e.target.value)}
            sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}>
            <MenuItem value="">— Choose a catalog —</MenuItem>
            {catalogsLoading && <MenuItem disabled sx={{ fontSize: 13 }}>Loading…</MenuItem>}
            {catalogsData.map((cat: any) => (
              <MenuItem key={cat.id} value={cat.id} sx={{ fontSize: 13 }}>📦 {cat.name || cat.id}</MenuItem>
            ))}
          </TextField>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Catalog actions */}
        {selectedChannel && (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<LinkIcon />}
              onClick={() => setShowLink(true)}
              sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px", borderColor: "#d1d5db", color: "#374151", "&:hover": { borderColor: "#065f46", color: "#065f46" } }}>
              Link Catalog
            </Button>
            <Button size="small" variant="outlined" startIcon={<AddIcon />}
              onClick={() => setShowCreate(true)}
              sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px", borderColor: "#d1d5db", color: "#374151", "&:hover": { borderColor: "#065f46", color: "#065f46" } }}>
              New Catalog
            </Button>
          </Stack>
        )}

        {/* Product actions (only when catalog selected) */}
        {selectedChannel && selectedCatalog && (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Sync products from Meta">
              <Button size="small" variant="outlined" startIcon={<SyncIcon sx={{ animation: syncing ? "spin 1s linear infinite" : "none", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />}
                onClick={handleSync} disabled={syncing}
                sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px", borderColor: "#d1d5db", color: "#374151", "&:hover": { borderColor: "#065f46", color: "#065f46" } }}>
                Sync
              </Button>
            </Tooltip>
            <Button size="small" variant="contained" startIcon={<AddIcon />}
              onClick={() => setShowAddProduct(true)}
              sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" } }}>
              Add Product
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Empty states */}
      {!selectedChannel && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2, border: "2px dashed #e5e7eb", borderRadius: "16px", bgcolor: "#fafafa" }}>
          <Typography fontSize={48}>🏪</Typography>
          <Box textAlign="center">
            <Typography fontSize={16} fontWeight={700} color="#374151">Select a channel to manage products</Typography>
            <Typography fontSize={13} color="#6b7280">Choose a WhatsApp channel to view and manage your catalog</Typography>
          </Box>
        </Box>
      )}

      {selectedChannel && !selectedCatalog && !catalogsLoading && catalogsData.length === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 3, border: "2px dashed #e5e7eb", borderRadius: "16px", bgcolor: "#fafafa" }}>
          <Typography fontSize={48}>📦</Typography>
          <Box textAlign="center">
            <Typography fontSize={16} fontWeight={700} color="#374151">No catalogs linked</Typography>
            <Typography fontSize={13} color="#6b7280" mt={0.5}>Create a new catalog or link an existing one from Meta Business Manager</Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => setShowLink(true)}
              sx={{ textTransform: "none", fontSize: 13, borderRadius: "8px", borderColor: "#065f46", color: "#065f46" }}>
              Link Existing
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreate(true)}
              sx={{ textTransform: "none", fontSize: 13, borderRadius: "8px", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" } }}>
              Create Catalog
            </Button>
          </Stack>
        </Box>
      )}

      {selectedChannel && !selectedCatalog && !catalogsLoading && catalogsData.length > 0 && (
        <Box textAlign="center" py={8}>
          <Typography fontSize={36}>👆</Typography>
          <Typography fontSize={15} fontWeight={600} color="#374151" mt={1}>Select a catalog above</Typography>
        </Box>
      )}

      {selectedChannel && selectedCatalog && productsLoading && (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress sx={{ color: "#25D366" }} /></Box>
      )}

      {selectedChannel && selectedCatalog && !productsLoading && products.length === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 3, border: "2px dashed #e5e7eb", borderRadius: "16px", bgcolor: "#fafafa" }}>
          <Typography fontSize={48}>🔍</Typography>
          <Box textAlign="center">
            <Typography fontSize={16} fontWeight={700} color="#374151">No products in this catalog</Typography>
            <Typography fontSize={13} color="#6b7280" mt={0.5}>Add your first product to start selling on WhatsApp</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddProduct(true)}
            sx={{ textTransform: "none", fontSize: 13, borderRadius: "8px", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" } }}>
            Add First Product
          </Button>
        </Box>
      )}

      {/* Products grid */}
      {products.length > 0 && (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography fontSize={13} color="#6b7280">{products.length} product{products.length !== 1 ? "s" : ""}</Typography>
          </Stack>
          <Grid container spacing={2}>
            {products.map((product: any) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <ProductCard
                  product={product}
                  channelId={selectedChannel}
                  catalogId={selectedCatalog}
                  onEdit={(p: any) => { setEditProduct(p); }}
                  onDelete={handleProductSuccess}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Dialogs */}
      <CreateCatalogDialog open={showCreate} channelId={selectedChannel} onClose={() => setShowCreate(false)} onSuccess={handleCatalogSuccess} />
      <LinkCatalogDialog open={showLink} channelId={selectedChannel} onClose={() => setShowLink(false)} onSuccess={handleCatalogSuccess} />
      {showAddProduct && (
        <ProductFormDialog open channelId={selectedChannel} catalogId={selectedCatalog}
          product={null} onClose={() => setShowAddProduct(false)} onSuccess={handleProductSuccess} />
      )}
      {editProduct && (
        <ProductFormDialog open channelId={selectedChannel} catalogId={selectedCatalog}
          product={editProduct} onClose={() => setEditProduct(null)} onSuccess={() => { setEditProduct(null); handleProductSuccess(); }} />
      )}
    </Box>
  );
};

/* ─── Orders Tab ─── */
const OrdersTab = () => {
  const navigate = useNavigate();
  const [channelFilter, setChannelFilter] = useState("");

  const { data: channelsData = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (res: any) => res.data || [],
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ecommerce-orders", channelFilter],
    queryFn: () => ecommerceService.getOrders({ channel_id: channelFilter || undefined, limit: 50 }),
    select: (res: any) => res.data || [],
  });

  const orders: any[] = data || [];
  const totalRevenue = orders.reduce((s, o) => s + calcOrderTotal(o).total, 0);

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        {[
          { label: "Total Orders", value: orders.length, icon: "🛒", color: "#065f46", bg: "#ecfdf5" },
          { label: "Total Revenue", value: `₹${totalRevenue.toFixed(2)}`, icon: "💰", color: "#1d4ed8", bg: "#eff6ff" },
        ].map((s) => (
          <Box key={s.label} sx={{ px: 3, py: 2, bgcolor: s.bg, borderRadius: "12px", border: `1px solid ${s.color}20`, minWidth: 160 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontSize={22}>{s.icon}</Typography>
              <Box>
                <Typography fontSize={20} fontWeight={800} color={s.color}>{s.value}</Typography>
                <Typography fontSize={12} color="#6b7280">{s.label}</Typography>
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField select size="small" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}
          sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}>
          <MenuItem value="">All Channels</MenuItem>
          {channelsData.map((ch: any) => (
            <MenuItem key={ch._id} value={ch._id} sx={{ fontSize: 13 }}>📱 {ch.channel_name || ch.display_phone_number}</MenuItem>
          ))}
        </TextField>
      </Box>

      {isLoading && <Box display="flex" justifyContent="center" py={10}><CircularProgress sx={{ color: "#25D366" }} /></Box>}
      {isError && <Box textAlign="center" py={10}><Typography color="error" fontWeight={600}>Failed to load orders</Typography></Box>}

      {!isLoading && !isError && orders.length === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2, border: "2px dashed #e5e7eb", borderRadius: "16px", bgcolor: "#fafafa" }}>
          <Typography fontSize={48}>🛍️</Typography>
          <Box textAlign="center">
            <Typography fontSize={16} fontWeight={700} color="#374151">No orders yet</Typography>
            <Typography fontSize={13} color="#6b7280">WhatsApp catalog orders will appear here</Typography>
          </Box>
        </Box>
      )}

      {!isLoading && orders.length > 0 && (
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {orders.map((order: any, idx: number) => {
            const { total, currency, itemCount, items } = calcOrderTotal(order);
            const contact = order.contact_id;
            const contactName = contact?.name || contact?.phone || "Unknown";
            const phone = contact?.phone || "";
            const channel = order.channel || channelsData.find((c: any) => c._id === (order.channel_id?._id || order.channel_id));
            const channelName = channel?.channel_name || channel?.display_phone_number || "";
            const note = order?.payload?.order?.text;
            return (
              <Box key={order._id || idx}>
                {idx > 0 && <Divider sx={{ borderColor: "#f9fafb" }} />}
                <Box onClick={() => contact?._id && navigate(`/chats?contactId=${contact._id}`)}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 2, px: 3, py: 2, cursor: contact?._id ? "pointer" : "default", "&:hover": contact?._id ? { bgcolor: "#f9fafb" } : {} }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "#ecfdf5", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🛒</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontSize={14} fontWeight={600} color="#111827" noWrap>{contactName}</Typography>
                      <Chip label={`${itemCount} item${itemCount !== 1 ? "s" : ""}`} size="small"
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 700, color: "#065f46", bgcolor: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: "6px" }} />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.75} mt={0.25} flexWrap="wrap">
                      {phone && <Typography fontSize={12} color="#6b7280">{phone}</Typography>}
                      {channelName && <><Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#d1d5db" }} /><Typography fontSize={12} color="#6b7280">{channelName}</Typography></>}
                    </Stack>
                    {items.slice(0, 2).map((item: any, i: number) => (
                      <Typography key={i} fontSize={11.5} color="#9ca3af" noWrap>
                        {item.product_retailer_id} × {item.quantity || 1} — {currency} {(Number(item.item_price) * Number(item.quantity || 1)).toFixed(2)}
                      </Typography>
                    ))}
                    {items.length > 2 && <Typography fontSize={11} color="#9ca3af">+{items.length - 2} more</Typography>}
                    {note && <Typography fontSize={11.5} color="#6b7280" fontStyle="italic" mt={0.25}>"{note}"</Typography>}
                  </Box>
                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    <Typography fontSize={14} fontWeight={800} color="#065f46">{currency} {total.toFixed(2)}</Typography>
                    <Tooltip title={new Date(order.createdAt).toLocaleString()}>
                      <Typography fontSize={11} color="#9ca3af" mt={0.25}>{formatTime(order.createdAt)}</Typography>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

/* ─── Main E-Commerce Page ─── */
const ECommerce = () => {
  const [tab, setTab] = useState(0);

  const { data: channelsData = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (res: any) => res.data || [],
  });

  const { data: ordersData = [] } = useQuery({
    queryKey: ["ecommerce-orders", ""],
    queryFn: () => ecommerceService.getOrders({ limit: 50 }),
    select: (res: any) => res.data || [],
  });

  const totalRevenue = (ordersData as any[]).reduce((s: number, o: any) => s + calcOrderTotal(o).total, 0);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Gradient Header */}
      <Box sx={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)", px: { xs: 2.5, md: 4 }, pt: 3, pb: 3, position: "relative", overflow: "hidden" }}>
        {[{ w: 220, h: 220, top: -80, right: 60, opacity: 0.05 }, { w: 140, h: 140, top: 20, right: 220, opacity: 0.04 }].map((c, i) => (
          <Box key={i} sx={{ position: "absolute", width: c.w, height: c.h, borderRadius: "50%", bgcolor: "#fff", opacity: c.opacity, top: c.top, right: c.right, pointerEvents: "none" }} />
        ))}
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 48, height: 48, borderRadius: "13px", bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShoppingBagOutlinedIcon sx={{ color: "#6ee7b7", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography fontSize={20} fontWeight={800} color="#fff" lineHeight={1.2} letterSpacing={-0.3}>E-Commerce</Typography>
              <Typography fontSize={12.5} color="#a7f3d0" fontWeight={500}>WhatsApp catalog & orders</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[
              { label: `${(ordersData as any[]).length} Orders`, color: "#fff", bg: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.2)" },
              { label: `₹${totalRevenue.toFixed(0)} Revenue`, color: "#86efac", bg: "rgba(134,239,172,0.12)", border: "rgba(134,239,172,0.3)" },
              { label: `${channelsData.length} Channel${channelsData.length !== 1 ? "s" : ""}`, color: "#93c5fd", bg: "rgba(147,197,253,0.12)", border: "rgba(147,197,253,0.3)" },
            ].map((s) => (
              <Chip key={s.label} label={s.label} size="small" sx={{ height: 26, fontSize: 11.5, fontWeight: 700, color: s.color, bgcolor: s.bg, border: `1px solid ${s.border}`, borderRadius: "8px" }} />
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", px: { xs: 2.5, md: 4 } }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ "& .MuiTab-root": { fontSize: 13, fontWeight: 600, textTransform: "none", minHeight: 48 }, "& .Mui-selected": { color: "#065f46" }, "& .MuiTabs-indicator": { bgcolor: "#065f46" } }}>
          <Tab icon={<ShoppingCartOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Orders" />
          <Tab icon={<StorefrontOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Products" />
        </Tabs>
      </Box>

      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
        {tab === 0 && <OrdersTab />}
        {tab === 1 && <ProductsTab />}
      </Box>
    </Box>
  );
};

export default ECommerce;
