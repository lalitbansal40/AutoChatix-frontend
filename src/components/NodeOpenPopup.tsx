import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Grid,
  Button,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { NODE_EDITORS } from "./node-editors";
import { useState } from "react";

const NodeOpenPopup = ({
  selectedNode,
  updateNodeData,
  onClose,
  allNodes,
}: any) => {
  const [openList, setOpenList] = useState(false);
  if (!selectedNode) return null;

  const EditorComponent =
    NODE_EDITORS[selectedNode.data.type] || null;

  const handleSave = () => {
    onClose();
  };

  const data = selectedNode.data || {};

  return (
    <Dialog
      open={!!selectedNode}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "1200px",
          maxWidth: "95vw",
          height: "85vh",
          borderRadius: 3,
          boxShadow: "0px 25px 80px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0,0,0,0.4)",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ fontWeight: 600, borderBottom: "1px solid #eee" }}>
        Edit Node ({data.type})

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ flex: 1, overflow: "hidden" }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>

          {/* LEFT: EDITOR */}
          <Grid item xs={12} md={8}>
            <Box sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
              {EditorComponent ? (
                <EditorComponent
                  node={selectedNode}
                  updateNodeData={updateNodeData}
                  allNodes={allNodes}
                />
              ) : (
                <Typography>No editor available</Typography>
              )}
            </Box>
          </Grid>

          {/* RIGHT: PREVIEW */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle2" mb={1}>
                Preview
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  border: "1px solid #ddd",
                  borderRadius: 3,
                  p: 2,
                  background: "#ece5dd",
                  overflowY: "auto",
                }}
              >
                <Box
                  sx={{
                    background: "#dcf8c6",
                    borderRadius: 2,
                    p: 2,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    maxWidth: "90%",
                  }}
                >
                  {/* ================= MEDIA ================= */}
                  {data.media?.url && (
                    <Box mb={1}>
                      {data.media.type === "image" && (
                        <img
                          src={data.media.url}
                          alt="media"
                          style={{
                            width: "100%",
                            borderRadius: 8,
                          }}
                        />
                      )}

                      {data.media.type === "video" && (
                        <video
                          src={data.media.url}
                          controls
                          style={{
                            width: "100%",
                            borderRadius: 8,
                          }}
                        />
                      )}

                      {data.media.type === "document" && (
                        <Typography>📄 Document</Typography>
                      )}
                    </Box>
                  )}

                  {/* ================= MESSAGE ================= */}
                  <Typography variant="body2" mb={2}>
                    {data.message || "Your message preview..."}
                  </Typography>

                  {/* ================= BUTTONS ================= */}
                  {(data.buttons || []).map((btn: any) => (
                    <Button
                      key={btn.id}
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{
                        mb: 1,
                        background: "#fff",
                        textTransform: "none",
                      }}
                    >
                      {btn.title}
                    </Button>
                  ))}

                  {data.messageType === "list" && (
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        mb: 1,
                        background: "#fff",
                        color: "#000",
                        textTransform: "none",
                        borderRadius: 2,
                      }}
                      onClick={() => setOpenList(true)}
                    >
                      📋 {data.cta || "List Items"}
                    </Button>
                  )}

                  {/* TIME */}
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "right",
                      color: "#555",
                      mt: 1,
                    }}
                  >
                    12:45 PM
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ borderTop: "1px solid #eee", px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>

        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
      {openList && (
        <Dialog
          open={openList}
          onClose={() => setOpenList(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            {data.cta || "Select Option"}
          </DialogTitle>

          <DialogContent>

            {(data.sections || []).map((section: any) => (
              <Box key={section.title} sx={{ mb: 2 }}>

                {/* SECTION TITLE */}
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "#666" }}
                >
                  {section.title}
                </Typography>

                {/* ROWS */}
                {(section.rows || []).map((row: any) => (
                  <Box
                    key={row.id}
                    sx={{
                      p: 1.5,
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      console.log("Selected:", row);
                      setOpenList(false);
                    }}
                  >
                    <Typography variant="body2">
                      {row.title}
                    </Typography>

                    {row.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {row.description}
                      </Typography>
                    )}
                  </Box>
                ))}

              </Box>
            ))}

          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default NodeOpenPopup;