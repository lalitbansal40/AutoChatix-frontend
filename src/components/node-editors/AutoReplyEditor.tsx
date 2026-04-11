import {
  Box,
  TextField,
  Button,
  Tabs,
  Tab,
  Typography,
  Divider,
  MenuItem,
  Grid,
} from "@mui/material";
import { useEffect, useState } from "react";
import mediaService from "service/media.service";
import { templateService } from "service/template.service";

const AutoReplyEditor = ({ node, updateNodeData, allNodes }: any) => {
  const [messageType, setMessageType] = useState(
    node.data.messageType || "text"
  );
  const [uploading, setUploading] = useState(false);


  const data = node?.data || {};
  const buttons = data.buttons || [];
  const nodesList = allNodes || [];

  /* ================= BUTTON HANDLERS ================= */
  const handleAddButton = () => {
    const updated = [
      ...buttons,
      {
        id: `BTN_${Date.now()}`,
        title: "New Button",
        type: "quick_reply",
      },
    ];
    updateNodeData("buttons", updated);
  };

  const handleFileUpload = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const url = await mediaService.uploadMedia(file);

      updateNodeData("media", {
        type,
        url,
        name: file.name, // 🔥 ADD THIS
      });

    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };


  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const flows = await templateService.getWhatsappFlows();
        updateNodeData("flows", flows);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFlows();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Box sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
      <Grid container rowSpacing={2}>
        {/* HEADER */}
        <Grid item xs={12}>
          <Typography variant="h6">Auto Reply</Typography>
        </Grid>

        {/* MESSAGE TYPE */}
        <Grid item xs={12}>
          <Tabs
            value={messageType}
            onChange={(e, v) => {
              setMessageType(v);
              updateNodeData("messageType", v);
            }}
            variant="scrollable"
          >
            <Tab label="Text" value="text" />
            <Tab label="Button/Flow" value="button" />
            <Tab label="List" value="list" />
            <Tab label="Address" value="address" />
            <Tab label="Location" value="location" />
            <Tab label="Carousel" value="carousel" />
          </Tabs>
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* ================= TEXT ================= */}
        {messageType === "text" && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Body"
              multiline
              rows={4}
              value={node.data.message || ""}
              onChange={(e) =>
                updateNodeData("message", e.target.value)
              }
            />
          </Grid>
        )}

        {/* ================= BUTTON ================= */}
        {messageType === "button" && (
          <>
            {/* MESSAGE */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Body"
                multiline
                rows={3}
                value={node.data.message || ""}
                onChange={(e) =>
                  updateNodeData("message", e.target.value)
                }
              />
            </Grid>

            {/* BUTTON LIST */}
            {buttons.map((btn: any, i: number) => (
              <Grid item xs={12} key={btn.id}>
                <Grid container spacing={2}>

                  {/* TITLE */}
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label={`Button ${i + 1}`}
                      value={btn.title}
                      onChange={(e) => {
                        const updated = [...buttons];
                        updated[i].title = e.target.value;
                        updateNodeData("buttons", updated);
                      }}
                    />
                  </Grid>

                  {/* TYPE */}
                  <Grid item xs={4}>
                    <TextField
                      select
                      fullWidth
                      label="Type"
                      value={btn.type || "quick_reply"}
                      onChange={(e) => {
                        const updated = [...buttons];
                        updated[i].type = e.target.value;
                        updateNodeData("buttons", updated);
                      }}
                    >
                      <MenuItem value="quick_reply">Quick Reply</MenuItem>
                      <MenuItem value="flow">WhatsApp Flow</MenuItem>
                      <MenuItem value="url">Open URL</MenuItem>
                    </TextField>
                  </Grid>

                  {/* DYNAMIC */}
                  <Grid item xs={4}>
                    {btn.type === "quick_reply" && (
                      <TextField
                        select
                        fullWidth
                        label="Next Node"
                        value={btn.nextNode || ""}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[i].nextNode = e.target.value;
                          updateNodeData("buttons", updated);
                        }}
                      >
                        {nodesList.map((n: any) => (
                          <MenuItem key={n.id} value={n.id}>
                            {n.id}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    {btn.type === "flow" && (
                      <TextField
                        select
                        fullWidth
                        label="Select Flow"
                        value={btn.flowId || ""}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[i].flowId = e.target.value;
                          updateNodeData("buttons", updated);
                        }}
                      >
                        {(data.flows || []).map((f: any) => (
                          <MenuItem key={f.id} value={f.id}>
                            {f.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    {btn.type === "url" && (
                      <TextField
                        fullWidth
                        label="URL"
                        value={btn.url || ""}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[i].url = e.target.value;
                          updateNodeData("buttons", updated);
                        }}
                      />
                    )}
                  </Grid>

                </Grid>
              </Grid>
            ))}

            {/* ADD BUTTON */}
            <Grid item xs={12}>
              <Button variant="outlined" onClick={handleAddButton}>
                + Add Button
              </Button>
            </Grid>
          </>
        )}

        {/* ================= LIST ================= */}
        {messageType === "list" && (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Body"
                multiline
                rows={3}
                value={node.data.message || ""}
                onChange={(e) =>
                  updateNodeData("message", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CTA Button Text"
                value={node.data.cta || ""}
                onChange={(e) =>
                  updateNodeData("cta", e.target.value)
                }
              />
            </Grid>
          </>
        )}

        {/* ================= ADDRESS ================= */}
        {messageType === "address" && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ask Address Message"
              value={node.data.message || ""}
              onChange={(e) =>
                updateNodeData("message", e.target.value)
              }
            />
          </Grid>
        )}

        {/* ================= LOCATION ================= */}
        {messageType === "location" && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ask Location Message"
              value={node.data.message || ""}
              onChange={(e) =>
                updateNodeData("message", e.target.value)
              }
            />
          </Grid>
        )}

        {/* ================= CAROUSEL ================= */}
        {messageType === "carousel" && (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Header"
                value={node.data.header || ""}
                onChange={(e) =>
                  updateNodeData("header", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => {
                  const items = node.data.items || [];
                  updateNodeData("items", [
                    ...items,
                    {
                      id: `item_${Date.now()}`,
                      title: "New Item",
                      description: "",
                    },
                  ]);
                }}
              >
                + Add Card
              </Button>
            </Grid>
          </>
        )}

        {/* ================= MEDIA ================= */}
        <Grid item xs={12}>
          <Grid container rowSpacing={2}>

            {/* TITLE */}
            <Grid item xs={12}>
              <Typography variant="subtitle2">Media</Typography>
            </Grid>

            {/* BUTTONS */}
            <Grid item xs={12}>
              <Grid container spacing={2}>

                <Grid item>
                  <Button variant="outlined" component="label" disabled={uploading}>
                    {uploading ? "Uploading..." : "Image"}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "image")}
                    />
                  </Button>
                </Grid>

                <Grid item>
                  <Button variant="outlined" component="label">
                    Video
                    <input
                      hidden
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, "video")}
                    />
                  </Button>
                </Grid>

                <Grid item>
                  <Button variant="outlined" component="label">
                    Document
                    <input
                      hidden
                      type="file"
                      onChange={(e) => handleFileUpload(e, "document")}
                    />
                  </Button>
                </Grid>

              </Grid>
            </Grid>

            {/* FILE NAME */}
            {data.media?.name && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Uploaded File"
                  value={data.media.name}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            )}

          </Grid>
        </Grid>
      </Grid>
    </Box >
  );
};

export default AutoReplyEditor;