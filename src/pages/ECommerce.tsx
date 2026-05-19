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
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

const ORDER_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "whatsapp_payment", label: "WhatsApp Payment" },
  { value: "razorpay", label: "Razorpay" },
  { value: "online", label: "Online" },
  { value: "cod", label: "COD" },
  { value: "manual", label: "Manual" },
];

const SHIPPING_METHOD_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "same_day", label: "Same Day" },
  { value: "pickup", label: "Pickup" },
  { value: "courier", label: "Courier" },
  { value: "manual", label: "Manual" },
];

const statusLabel = (options: { value: string; label: string }[], value?: string) =>
  options.find((o) => o.value === value)?.label || value || "";

const getOrderMeta = (order: any) => order?.payload?.order_meta || {};

const getDefaultOrderForm = (order: any) => {
  const meta = getOrderMeta(order);
  return {
    payment_status: meta.payment_status || "unpaid",
    payment_type: meta.payment_type || "whatsapp_payment",
    order_status: meta.order_status || "new",
    payment_reference: meta.payment_reference || "",
    shipping_method: meta.shipping_method || "standard",
    shipping_fee: meta.shipping_fee || "",
    tracking_id: meta.tracking_id || "",
    courier_name: meta.courier_name || "",
    customer_note: meta.customer_note || order?.payload?.order?.text || "",
    internal_note: meta.internal_note || "",
    delivery_address: {
      name: meta.delivery_address?.name || order?.contact_id?.name || "",
      phone: meta.delivery_address?.phone || order?.contact_id?.phone || "",
      line1: meta.delivery_address?.line1 || "",
      line2: meta.delivery_address?.line2 || "",
      city: meta.delivery_address?.city || "",
      state: meta.delivery_address?.state || "",
      pincode: meta.delivery_address?.pincode || "",
      country: meta.delivery_address?.country || "India",
    },
  };
};

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
      if (e?.response?.data?.needs_catalog_token) {
        setApiError("Missing catalog_management permission. Go to Products page and set a System User access token first.");
      } else {
        const msg = e?.response?.data?.error?.message || e?.response?.data?.message || "Failed to save product";
        setApiError(msg);
      }
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

  const [deleteError, setDeleteError] = useState("");
  const deleteMutation = useMutation({
    mutationFn: () => ecommerceService.deleteProduct(channelId, catalogId, product.id),
    onSuccess: onDelete,
    onError: (e: any) => {
      const msg = e?.response?.data?.needs_catalog_token
        ? "Set a System User token with catalog_management permission first."
        : e?.response?.data?.message || "Failed to delete";
      setDeleteError(msg);
      setTimeout(() => setDeleteError(""), 5000);
    },
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
        <Tooltip title={deleteError || "Delete product"}>
          <IconButton size="small" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
            sx={{ bgcolor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", "&:hover": { bgcolor: "#fef2f2" }, width: 28, height: 28 }}>
            {deleteMutation.isPending
              ? <CircularProgress size={12} />
              : <DeleteOutlineIcon sx={{ fontSize: 14, color: deleteError ? "#f97316" : "#dc2626" }} />}
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

const META_APP_ID = process.env.REACT_APP_META_APP_ID || "955625287255039";

/* ─── Facebook Catalog Connect Dialog ─── */
const FacebookCatalogConnectDialog = ({ open, channelId, onClose, onSuccess }: { open: boolean; channelId: string; onClose: () => void; onSuccess: () => void; }) => {
  const [step, setStep] = useState<"idle" | "authorizing" | "selecting" | "saving">("idle");
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState("");

  const catalogsForBusiness = businesses.find((b) => b.id === selectedBusiness)?.owned_product_catalogs?.data || [];

  const reset = () => { setStep("idle"); setError(""); setAccessToken(""); setBusinesses([]); setSelectedBusiness(""); setSelectedCatalog(""); };
  const handleClose = () => { onClose(); reset(); };

  const handleFacebookLogin = () => {
    if (!(window as any).FB) { setError("Facebook SDK not loaded. Please wait and try again."); return; }
    setError(""); setStep("authorizing");
    (window as any).FB.login((response: any) => {
      // Implicit flow: get accessToken directly from authResponse
      const token = response.authResponse?.accessToken;
      if (!token) { setStep("idle"); setError("Facebook authorization cancelled. Please try again."); return; }
      ecommerceService.facebookOAuthAuthorize(channelId, token)
        .then((data: any) => {
          setAccessToken(data.access_token);
          setBusinesses(data.businesses || []);
          if (data.businesses?.length === 1) setSelectedBusiness(data.businesses[0].id);
          setStep("selecting");
        })
        .catch((err: any) => { setError(err?.response?.data?.message || "Authorization failed. Please try again."); setStep("idle"); });
    }, { scope: "catalog_management,business_management" });
  };

  const handleSave = () => {
    if (!selectedCatalog) { setError("Please select a catalog."); return; }
    setStep("saving"); setError("");
    // Use business-scoped access_token when available (matches Rampwin pattern)
    const businessObj = businesses.find((b: any) => b.id === selectedBusiness);
    const tokenToSave = businessObj?.access_token || accessToken;
    ecommerceService.facebookOAuthSave(channelId, tokenToSave, selectedCatalog)
      .then(() => { onSuccess(); handleClose(); })
      .catch((err: any) => { setError(err?.response?.data?.message || "Failed to save."); setStep("selecting"); });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Connect Facebook Catalog
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8, color: "#6b7280" }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}

        {(step === "idle" || step === "authorizing") && (
          <Stack spacing={2.5} alignItems="center" py={2}>
            <Box sx={{ textAlign: "center", maxWidth: 420 }}>
              <Typography fontSize={13.5} fontWeight={600} color="#374151" mb={0.5}>Authorize via Facebook</Typography>
              <Typography fontSize={12.5} color="#6b7280" lineHeight={1.6}>
                Log in with the Facebook account that owns your catalog. We'll fetch your businesses and catalogs automatically.
              </Typography>
            </Box>
            <Button variant="contained" disabled={step === "authorizing"} onClick={handleFacebookLogin}
              startIcon={step === "authorizing" ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : undefined}
              sx={{ bgcolor: "#1877F2", color: "#fff", fontWeight: 700, fontSize: 14, borderRadius: "8px", px: 3, py: 1.2, textTransform: "none", "&:hover": { bgcolor: "#1666d8" }, minWidth: 240 }}>
              {step === "authorizing" ? "Authorizing…" : "Continue with Facebook"}
            </Button>
          </Stack>
        )}

        {step === "selecting" && (
          <Stack spacing={2} pt={1}>
            <Alert severity="success" sx={{ fontSize: 12 }}>Facebook authorized. Select your business and catalog.</Alert>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: 12 }}>Business</InputLabel>
              <Select value={selectedBusiness} onChange={(e) => { setSelectedBusiness(e.target.value); setSelectedCatalog(""); }} label="Business" sx={{ borderRadius: "8px", fontSize: 13 }}>
                {businesses.map((b: any) => <MenuItem key={b.id} value={b.id} sx={{ fontSize: 13 }}>🏢 {b.name}</MenuItem>)}
              </Select>
            </FormControl>
            {selectedBusiness && (
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: 12 }}>Catalog</InputLabel>
                <Select value={selectedCatalog} onChange={(e) => setSelectedCatalog(e.target.value)} label="Catalog" sx={{ borderRadius: "8px", fontSize: 13 }}>
                  <MenuItem value="" disabled sx={{ fontSize: 13 }}>{catalogsForBusiness.length === 0 ? "No catalogs in this business" : "Select a catalog"}</MenuItem>
                  {catalogsForBusiness.map((cat: any) => <MenuItem key={cat.id} value={cat.id} sx={{ fontSize: 13 }}>📦 {cat.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {!businesses.length && <Alert severity="warning" sx={{ fontSize: 12 }}>No businesses found. Make sure you have a Meta Business Manager account.</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} size="small" sx={{ textTransform: "none", color: "#6b7280" }}>Cancel</Button>
        {step === "selecting" && (
          <Button variant="contained" size="small" disabled={!selectedCatalog} onClick={handleSave}
            sx={{ textTransform: "none", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" }, borderRadius: "8px" }}>
            Connect Catalog
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/* ─── Set Catalog Token Dialog ─── */
const SetCatalogTokenDialog = ({ open, channelId, onClose, onSuccess }: { open: boolean; channelId: string; onClose: () => void; onSuccess: () => void; }) => {
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => { onClose(); setToken(""); setError(""); setShow(false); };

  const handleSave = async () => {
    if (!token.trim()) { setError("Token is required."); return; }
    setSaving(true);
    setError("");
    try {
      await ecommerceService.saveCatalogToken(channelId, token.trim());
      onSuccess();
      handleClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save token.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Set Catalog Access Token
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8, color: "#6b7280" }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
          Go to <strong>Meta Business Manager → System Users → Generate Token</strong> with <strong>catalog_management</strong> permission. Paste it below.
        </Alert>
        {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }}>{error}</Alert>}
        <TextField
          autoFocus fullWidth size="small"
          type={show ? "text" : "password"}
          label="System User Access Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="EAAxxxxx..."
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          InputLabelProps={{ sx: { fontSize: 12 } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShow(!show)} edge="end">
                  {show ? <VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} size="small" sx={{ textTransform: "none", color: "#6b7280" }}>Cancel</Button>
        <Button
          variant="contained" size="small"
          disabled={!token.trim() || saving}
          onClick={handleSave}
          sx={{ textTransform: "none", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" }, borderRadius: "8px" }}
        >
          {saving ? "Saving…" : "Save Token"}
        </Button>
      </DialogActions>
    </Dialog>
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
  const [forceRetry, setForceRetry] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [autoDetectMsg, setAutoDetectMsg] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showFbConnect, setShowFbConnect] = useState(false);

  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) return;
    (window as any).fbAsyncInit = () => {
      (window as any).FB.init({ appId: META_APP_ID, autoLogAppEvents: true, xfbml: true, version: "v21.0" });
    };
    const script = document.createElement("script");
    script.id = "facebook-jssdk"; script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true; script.defer = true; document.body.appendChild(script);
  }, []);

  const { data: channelsData = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (res: any) => res.data || [],
  });

  const selectedChannelObj = channelsData.find((c: any) => c._id === selectedChannel);
  // Skip Meta API if SMB and no directly linked catalog stored
  const hasLinkedCatalog = !!selectedChannelObj?.linked_catalog_id;
  const channelCatalogUnsupported = selectedChannelObj?.catalog_supported === false && !hasLinkedCatalog;

  const { data: catalogsResp, isLoading: catalogsLoading } = useQuery({
    queryKey: ["catalogs", selectedChannel, forceRetry],
    queryFn: () => ecommerceService.getCatalogs(selectedChannel, forceRetry),
    // Always run when channel selected — backend returns from DB cache instantly for SMB/linked accounts
    enabled: !!selectedChannel && (!channelCatalogUnsupported || forceRetry),
  });
  const catalogsData: any[] = catalogsResp?.catalogs || [];
  const catalogsUnsupported: boolean = (!forceRetry && channelCatalogUnsupported) || catalogsResp?.unsupported === true;

  // After successful retry or link — refresh channels so catalog flags are reflected
  useEffect(() => {
    if (catalogsData.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      if (forceRetry) setForceRetry(false);
    }
  }, [catalogsData.length]);

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products", selectedChannel, selectedCatalog],
    queryFn: () => ecommerceService.getProducts(selectedChannel, selectedCatalog, { limit: 50 }),
    select: (res: any) => res.products || [],
    enabled: !!selectedChannel && !!selectedCatalog,
    retry: false,
  });

  const products: any[] = productsData || [];
  const needsCatalogToken = (productsError as any)?.response?.data?.needs_catalog_token === true;

  const handleSync = async () => {
    if (!selectedChannel || !selectedCatalog) return;
    setSyncing(true);
    try {
      await ecommerceService.syncProducts(selectedChannel, selectedCatalog);
      await queryClient.invalidateQueries({ queryKey: ["products", selectedChannel, selectedCatalog] });
      await queryClient.invalidateQueries({ queryKey: ["catalogs", selectedChannel] });
    } finally {
      setSyncing(false);
    }
  };

  const handleCatalogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["catalogs", selectedChannel] });
  };

  const handleProductSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["products", selectedChannel, selectedCatalog] });
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    setAutoDetectMsg("");
    try {
      await ecommerceService.autoDetectCatalog(selectedChannel);
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
      await queryClient.invalidateQueries({ queryKey: ["catalogs", selectedChannel] });
      setAutoDetectMsg("Catalog detected!");
    } catch (e: any) {
      setAutoDetectMsg(e?.response?.data?.message || "Detection failed. Link a catalog in Meta Business Manager → WhatsApp → Commerce Settings first.");
    } finally {
      setAutoDetecting(false);
      setTimeout(() => setAutoDetectMsg(""), 7000);
    }
  };

  return (
    <Box>
      {/* Channel + Catalog + Actions row */}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1.5} mb={3} flexWrap="wrap">
        <TextField select size="small" label="Select Channel" value={selectedChannel}
          onChange={(e) => { setSelectedChannel(e.target.value); setSelectedCatalog(""); setForceRetry(false); }}
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
            <Tooltip title="Set System User Token for catalog_management permission">
              <Button size="small" variant="outlined" onClick={() => setShowTokenDialog(true)}
                sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px", borderColor: "#d1d5db", color: "#6b7280", minWidth: 0, px: 1.2, "&:hover": { borderColor: "#1e40af", color: "#1e40af" } }}>
                🔑
              </Button>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      {/* Catalog auto-detect banner */}
      {selectedChannel && (
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            {hasLinkedCatalog ? (
              <>
                <Chip label="Catalog Linked ✓" size="small"
                  sx={{ bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#065f46", fontWeight: 700, fontSize: 12 }} />
                <Button size="small" onClick={handleAutoDetect} disabled={autoDetecting}
                  sx={{ fontSize: 11.5, color: "#6b7280", textTransform: "none" }}>
                  {autoDetecting ? "Re-detecting…" : "Re-detect"}
                </Button>
                <Button size="small" variant="outlined" onClick={() => setShowFbConnect(true)}
                  sx={{ fontSize: 11.5, borderRadius: "8px", textTransform: "none", borderColor: "#1877F2", color: "#1877F2", "&:hover": { bgcolor: "#eff6ff" } }}>
                  Connect via Facebook
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" size="small" disabled={autoDetecting}
                  startIcon={autoDetecting ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SyncIcon sx={{ fontSize: "15px !important" }} />}
                  onClick={handleAutoDetect}
                  sx={{ bgcolor: "#065f46", color: "#fff", fontWeight: 700, fontSize: 12, borderRadius: "8px", px: 2, textTransform: "none", "&:hover": { bgcolor: "#047857" } }}>
                  {autoDetecting ? "Detecting…" : "Auto-detect Catalog"}
                </Button>
                <Button size="small" variant="outlined" onClick={() => setShowFbConnect(true)}
                  sx={{ fontSize: 12, borderRadius: "8px", textTransform: "none", borderColor: "#1877F2", color: "#1877F2", "&:hover": { bgcolor: "#eff6ff" } }}>
                  Connect via Facebook
                </Button>
              </>
            )}
            {autoDetectMsg && (
              <Typography fontSize={11.5} color={autoDetectMsg === "Catalog detected!" ? "#16a34a" : "#dc2626"} sx={{ maxWidth: 480 }}>
                {autoDetectMsg}
              </Typography>
            )}
          </Stack>
        </Box>
      )}

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

      {selectedChannel && !selectedCatalog && !catalogsLoading && catalogsUnsupported && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2.5, border: "2px solid #fde68a", borderRadius: "16px", bgcolor: "#fffbeb" }}>
          <Typography fontSize={48}>⚠️</Typography>
          <Box textAlign="center" maxWidth={480}>
            <Typography fontSize={16} fontWeight={700} color="#92400e">Catalog Not Detected</Typography>
            <Typography fontSize={13} color="#78350f" mt={1} lineHeight={1.7}>
              No catalog found for this channel. If you've already linked a catalog in{" "}
              <Box component="a" href="https://business.facebook.com" target="_blank" sx={{ color: "#b45309", fontWeight: 600 }}>
                Meta WhatsApp Manager
              </Box>
              , click Retry to refresh.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => setForceRetry(true)}
            sx={{ borderRadius: "8px", fontSize: 13, fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" }, px: 3 }}
          >
            🔄 Retry Detection
          </Button>
        </Box>
      )}

      {selectedChannel && !selectedCatalog && !catalogsLoading && !catalogsUnsupported && catalogsData.length === 0 && (
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

      {selectedChannel && selectedCatalog && !productsLoading && needsCatalogToken && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2, border: "2px solid #bfdbfe", borderRadius: "16px", bgcolor: "#eff6ff" }}>
          <Typography fontSize={40}>🔑</Typography>
          <Box textAlign="center" maxWidth={480}>
            <Typography fontSize={15} fontWeight={700} color="#1e40af">Catalog Access Token Required</Typography>
            <Typography fontSize={13} color="#1e3a8a" mt={1} lineHeight={1.7}>
              Your WABA channel token doesn't have <strong>catalog_management</strong> permission.
              Connect via Facebook to authorize with your own account, or provide a System User token.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center">
            <Button
              variant="contained" size="small"
              onClick={() => setShowFbConnect(true)}
              sx={{ borderRadius: "8px", fontSize: 13, fontWeight: 700, bgcolor: "#1877F2", "&:hover": { bgcolor: "#1666d8" }, px: 3, textTransform: "none" }}
            >
              Connect via Facebook
            </Button>
            <Button
              variant="outlined" size="small"
              onClick={() => setShowTokenDialog(true)}
              sx={{ borderRadius: "8px", fontSize: 13, fontWeight: 700, color: "#1e40af", borderColor: "#1e40af", "&:hover": { bgcolor: "#eff6ff" }, px: 3, textTransform: "none" }}
            >
              Set System User Token
            </Button>
          </Stack>
        </Box>
      )}

      {selectedChannel && selectedCatalog && !productsLoading && !needsCatalogToken && products.length === 0 && (
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
      <FacebookCatalogConnectDialog
        open={showFbConnect}
        channelId={selectedChannel}
        onClose={() => setShowFbConnect(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["channels"] });
          queryClient.invalidateQueries({ queryKey: ["catalogs", selectedChannel] });
          queryClient.invalidateQueries({ queryKey: ["products", selectedChannel, selectedCatalog] });
        }}
      />
      <SetCatalogTokenDialog
        open={showTokenDialog}
        channelId={selectedChannel}
        onClose={() => setShowTokenDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["channels"] });
          queryClient.invalidateQueries({ queryKey: ["products", selectedChannel, selectedCatalog] });
        }}
      />
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

const OrderEditDialog = ({ order, open, onClose, onSaved }: any) => {
  const [form, setForm] = useState<any>(() => getDefaultOrderForm(order));
  const { total, currency, itemCount, items } = calcOrderTotal(order);
  const contact = order?.contact_id;

  useEffect(() => {
    setForm(getDefaultOrderForm(order));
  }, [order]);

  const update = (field: string) => (e: any) => {
    setForm((prev: any) => ({ ...prev, [field]: e.target.value }));
  };

  const updateAddress = (field: string) => (e: any) => {
    setForm((prev: any) => ({
      ...prev,
      delivery_address: {
        ...prev.delivery_address,
        [field]: e.target.value,
      },
    }));
  };

  const mutation = useMutation({
    mutationFn: () => ecommerceService.updateOrder(order._id, form),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  if (!order) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Order Details
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, color: "#6b7280" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} mb={1.5}>
                <Box>
                  <Typography fontSize={15} fontWeight={800}>{contact?.name || "Customer"}</Typography>
                  <Typography fontSize={12.5} color="#6b7280">{contact?.phone || form.delivery_address.phone}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography fontSize={17} fontWeight={900} color="#065f46">{currency} {total.toFixed(2)}</Typography>
                  <Typography fontSize={11.5} color="#6b7280">{itemCount} item{itemCount !== 1 ? "s" : ""}</Typography>
                </Box>
              </Stack>

              <Stack spacing={1}>
                {items.map((item: any, index: number) => (
                  <Box key={`${item.product_retailer_id}-${index}`} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1, borderTop: index ? "1px solid #f3f4f6" : 0 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontSize={12.5} fontWeight={700} color="#111827" noWrap>
                        {item.name || item.product_name || item.product_retailer_id}
                      </Typography>
                      <Typography fontSize={11.5} color="#6b7280">Qty {item.quantity || 1} · {item.product_retailer_id}</Typography>
                    </Box>
                    <Typography fontSize={12.5} fontWeight={800} color="#111827" flexShrink={0}>
                      {currency} {(Number(item.item_price) * Number(item.quantity || 1)).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", p: 2, mt: 2 }}>
              <Typography fontSize={13} fontWeight={800} mb={1.5}>Delivery Address</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Name" value={form.delivery_address.name} onChange={updateAddress("name")} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" value={form.delivery_address.phone} onChange={updateAddress("phone")} /></Grid>
                <Grid item xs={12}><TextField fullWidth size="small" label="Address Line 1" value={form.delivery_address.line1} onChange={updateAddress("line1")} /></Grid>
                <Grid item xs={12}><TextField fullWidth size="small" label="Address Line 2" value={form.delivery_address.line2} onChange={updateAddress("line2")} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="City" value={form.delivery_address.city} onChange={updateAddress("city")} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="State" value={form.delivery_address.state} onChange={updateAddress("state")} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Pincode" value={form.delivery_address.pincode} onChange={updateAddress("pincode")} /></Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", p: 2 }}>
              <Typography fontSize={13} fontWeight={800} mb={1.5}>Status & Payment</Typography>
              <Stack spacing={1.5}>
                <TextField select fullWidth size="small" label="Order Status" value={form.order_status} onChange={update("order_status")}>
                  {ORDER_STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField select fullWidth size="small" label="Payment Status" value={form.payment_status} onChange={update("payment_status")}>
                  {PAYMENT_STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField select fullWidth size="small" label="Payment Type" value={form.payment_type} onChange={update("payment_type")}>
                  {PAYMENT_TYPE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField fullWidth size="small" label="Payment Reference" value={form.payment_reference} onChange={update("payment_reference")} />
                <TextField select fullWidth size="small" label="Shipping Method" value={form.shipping_method} onChange={update("shipping_method")}>
                  {SHIPPING_METHOD_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField fullWidth size="small" label="Shipping Fee" value={form.shipping_fee} onChange={update("shipping_fee")} />
                <TextField fullWidth size="small" label="Courier Name" value={form.courier_name} onChange={update("courier_name")} />
                <TextField fullWidth size="small" label="Tracking ID" value={form.tracking_id} onChange={update("tracking_id")} />
                <TextField fullWidth multiline minRows={2} size="small" label="Customer Note" value={form.customer_note} onChange={update("customer_note")} />
                <TextField fullWidth multiline minRows={2} size="small" label="Internal Note" value={form.internal_note} onChange={update("internal_note")} />
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#6b7280" }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          sx={{ textTransform: "none", bgcolor: "#065f46", "&:hover": { bgcolor: "#047857" }, borderRadius: "8px", fontWeight: 700 }}
        >
          {mutation.isPending ? "Saving..." : "Save Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Orders Tab ─── */
const OrdersTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [channelFilter, setChannelFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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

  const orders: any[] = (data || []).filter((order: any) => {
    const meta = getOrderMeta(order);
    const paymentStatus = meta.payment_status || "unpaid";
    const orderStatus = meta.order_status || "new";
    return (!paymentFilter || paymentStatus === paymentFilter) && (!statusFilter || orderStatus === statusFilter);
  });
  const totalRevenue = orders.reduce((s, o) => s + calcOrderTotal(o).total, 0);
  const paidRevenue = orders
    .filter((o) => (getOrderMeta(o).payment_status || "unpaid") === "paid")
    .reduce((s, o) => s + calcOrderTotal(o).total, 0);
  const pendingOrders = orders.filter((o) => !["delivered", "cancelled", "returned"].includes(getOrderMeta(o).order_status || "new")).length;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        {[
          { label: "Total Orders", value: orders.length, icon: "🛒", color: "#065f46", bg: "#ecfdf5" },
          { label: "Total Revenue", value: `₹${totalRevenue.toFixed(2)}`, icon: "💰", color: "#1d4ed8", bg: "#eff6ff" },
          { label: "Paid Revenue", value: `₹${paidRevenue.toFixed(2)}`, icon: "₹", color: "#15803d", bg: "#f0fdf4" },
          { label: "In Progress", value: pendingOrders, icon: "↗", color: "#b45309", bg: "#fffbeb" },
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

      <Box sx={{ mb: 2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField select size="small" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}
          sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}>
          <MenuItem value="">All Channels</MenuItem>
          {channelsData.map((ch: any) => (
            <MenuItem key={ch._id} value={ch._id} sx={{ fontSize: 13 }}>📱 {ch.channel_name || ch.display_phone_number}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
          sx={{ minWidth: 170, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}>
          <MenuItem value="">All Payments</MenuItem>
          {PAYMENT_STATUS_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 190, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}>
          <MenuItem value="">All Order Status</MenuItem>
          {ORDER_STATUS_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
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
            const meta = getOrderMeta(order);
            const contact = order.contact_id;
            const contactName = contact?.name || contact?.phone || "Unknown";
            const phone = contact?.phone || "";
            const channel = order.channel || channelsData.find((c: any) => c._id === (order.channel_id?._id || order.channel_id));
            const channelName = channel?.channel_name || channel?.display_phone_number || "";
            const note = order?.payload?.order?.text;
            const paymentStatus = meta.payment_status || "unpaid";
            const orderStatus = meta.order_status || "new";
            const paymentType = meta.payment_type || "whatsapp_payment";
            const shippingMethod = meta.shipping_method;
            return (
              <Box key={order._id || idx}>
                {idx > 0 && <Divider sx={{ borderColor: "#f9fafb" }} />}
                <Box onClick={() => setSelectedOrder(order)}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 2, px: 3, py: 2, cursor: "pointer", "&:hover": { bgcolor: "#f9fafb" } }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "#ecfdf5", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🛒</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontSize={14} fontWeight={600} color="#111827" noWrap>{contactName}</Typography>
                      <Chip label={`${itemCount} item${itemCount !== 1 ? "s" : ""}`} size="small"
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 700, color: "#065f46", bgcolor: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: "6px" }} />
                      <Chip label={statusLabel(PAYMENT_STATUS_OPTIONS, paymentStatus)} size="small"
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 800, color: paymentStatus === "paid" ? "#166534" : "#92400e", bgcolor: paymentStatus === "paid" ? "#dcfce7" : "#fef3c7", borderRadius: "6px" }} />
                      <Chip label={statusLabel(ORDER_STATUS_OPTIONS, orderStatus)} size="small"
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 700, color: "#1f2937", bgcolor: "#f3f4f6", borderRadius: "6px" }} />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.75} mt={0.25} flexWrap="wrap">
                      {phone && <Typography fontSize={12} color="#6b7280">{phone}</Typography>}
                      {channelName && <><Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#d1d5db" }} /><Typography fontSize={12} color="#6b7280">{channelName}</Typography></>}
                      <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#d1d5db" }} />
                      <Typography fontSize={12} color="#6b7280">{statusLabel(PAYMENT_TYPE_OPTIONS, paymentType)}</Typography>
                      {shippingMethod && (
                        <>
                          <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#d1d5db" }} />
                          <Typography fontSize={12} color="#6b7280">{statusLabel(SHIPPING_METHOD_OPTIONS, shippingMethod)}</Typography>
                        </>
                      )}
                    </Stack>
                    {items.slice(0, 2).map((item: any, i: number) => (
                      <Typography key={i} fontSize={11.5} color="#9ca3af" noWrap>
                        {item.name || item.product_name || item.product_retailer_id} × {item.quantity || 1} — {currency} {(Number(item.item_price) * Number(item.quantity || 1)).toFixed(2)}
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
                    {contact?._id && (
                      <Button
                        size="small"
                        onClick={(e) => { e.stopPropagation(); navigate(`/chats?contactId=${contact._id}`); }}
                        sx={{ mt: 0.75, textTransform: "none", fontSize: 11, color: "#065f46", minWidth: 0, px: 1 }}
                      >
                        Chat
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
      {selectedOrder && (
        <OrderEditDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["ecommerce-orders"] })}
        />
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
