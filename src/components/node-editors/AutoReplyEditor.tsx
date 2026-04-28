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
    node.data.type === "list"
      ? "list"
      : node.data.messageType || "text"
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
        id: `BTN_${Date.now()}_${Math.random()}`,
        title: "New Button",
        type: "quick_reply",
      },
    ];
    updateNodeData(node.id, { buttons: updated });
  };

  const handleFileUpload = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const url = await mediaService.uploadMedia(file);

      updateNodeData(node.id, {
        media: { type, url, name: file.name }
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
        const flows = await templateService.getWhatsappFlows("PUBLISHED");
        updateNodeData(node.id, { flows });
      } catch (err) {
        console.error(err);
      }
    };

    fetchFlows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messageType === "list" && !node.data.sections) {
      updateNodeData(node.id, {
        sections: [
          {
            title: "Section 1",
            rows: [
              {
                id: `row_${Date.now()}`,
                title: "Option 1",
                description: "",
                nextNode: "",
              },
            ],
          },
        ]
      });
    }
  }, [messageType, node.data.sections]);
  return (
    <Box
      sx={{
        height: "80vh",   // 👈 fixed viewport height
        display: "flex",
        flexDirection: "column",
      }}
    >
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

              // 🔥 TYPE SYNC (VERY IMPORTANT)
              if (v === "list") {
                updateNodeData("type", "list");
              } else if (node.data.type === "list") {
                updateNodeData("type", "auto_reply");
              }
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
                updateNodeData(node.id, { message: e.target.value })
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
                  updateNodeData(node.id, { message: e.target.value })
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
                        const updated = buttons.map((btn: any, index: number) =>
                          index === i
                            ? { ...btn, title: e.target.value }
                            : btn
                        );

                        updateNodeData(node.id, { buttons: updated });
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
                        const updated = buttons.map((btn: any, index: number) =>
                          index === i
                            ? { ...btn, type: e.target.value }
                            : btn
                        );

                        updateNodeData(node.id, { buttons: updated });
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
                          const updated = buttons.map((btn: any, index: number) =>
                            index === i
                              ? { ...btn, nextNode: e.target.value }
                              : btn
                          );

                          updateNodeData(node.id, { buttons: updated });
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
                          const updated = buttons.map((btn: any, index: number) =>
                            index === i
                              ? { ...btn, flowId: e.target.value }
                              : btn
                          );

                          updateNodeData(node.id, { buttons: updated });
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
                          const updated = buttons.map((btn: any, index: number) =>
                            index === i
                              ? { ...btn, url: e.target.value }
                              : btn
                          );

                          updateNodeData(node.id, { buttons: updated });
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
            {/* INIT DEFAULT */}
            {(!node.data.sections || node.data.sections.length === 0) && (
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    updateNodeData("sections", [
                      {
                        title: "Section 1",
                        rows: [
                          {
                            id: `row_${Date.now()}`,
                            title: "Option 1",
                            description: "",
                            nextNode: "",
                          },
                        ],
                      },
                    ]);
                  }}
                >
                  + Add First Section
                </Button>
              </Grid>
            )}

            {/* MESSAGE */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Body"
                multiline
                rows={3}
                value={node.data.message || ""}
                onChange={(e) =>
                  updateNodeData(node.id, { message: e.target.value })
                }
              />
            </Grid>

            {/* CTA */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CTA Button Text"
                value={node.data.button_text || ""}
                onChange={(e) => updateNodeData(node.id, { button_text: e.target.value })}
              />
            </Grid>

            {/* SECTIONS */}
            {(node.data.sections || []).map((section: any, si: number) => (
              <Grid item xs={12} key={si}>
                <Box sx={{ border: "1px solid #ddd", p: 2, borderRadius: 2 }}>

                  {/* SECTION TITLE */}
                  <TextField
                    fullWidth
                    label="Section Title"
                    value={section.title}
                    onChange={(e) => {
                      const updated = JSON.parse(JSON.stringify(node.data.sections));
                      updated[si].title = e.target.value;
                      updateNodeData(node.id, { sections: updated });
                    }}
                    sx={{ mb: 2 }}
                  />

                  {/* ROWS */}
                  {(section.rows || []).map((row: any, ri: number) => (
                    <Grid container spacing={2} key={row.id} sx={{ mb: 1 }}>

                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Title"
                          value={row.title}
                          onChange={(e) => {
                            const updated = JSON.parse(JSON.stringify(node.data.sections));
                            updated[si].rows[ri].title = e.target.value;
                            updateNodeData(node.id, { sections: updated });
                          }}
                        />
                      </Grid>

                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={row.description || ""}
                          onChange={(e) => {
                            const updated = JSON.parse(JSON.stringify(node.data.sections));
                            updated[si].rows[ri].description = e.target.value;
                            updateNodeData(node.id, { sections: updated });
                          }}
                        />
                      </Grid>

                      <Grid item xs={3}>
                        <TextField
                          select
                          fullWidth
                          label="Next Node"
                          value={row.nextNode || ""}
                          onChange={(e) => {
                            const updated = JSON.parse(JSON.stringify(node.data.sections));
                            updated[si].rows[ri].nextNode = e.target.value;
                            updateNodeData(node.id, { sections: updated });
                          }}
                        >
                          {allNodes.map((n: any) => (
                            <MenuItem key={n.id} value={n.id}>
                              {n.id}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* DELETE ROW */}
                      <Grid item xs={3}>
                        <Button
                          color="error"
                          onClick={() => {
                            const updated = JSON.parse(JSON.stringify(node.data.sections));
                            updated[si].rows.splice(ri, 1);
                            updateNodeData(node.id, { sections: updated });
                          }}
                        >
                          Delete
                        </Button>
                      </Grid>

                    </Grid>
                  ))}

                  {/* ADD ROW */}
                  <Button
                    size="small"
                    onClick={() => {
                      const updated = JSON.parse(JSON.stringify(node.data.sections));

                      if ((updated[si].rows || []).length >= 10) {
                        alert("Max 10 options allowed");
                        return;
                      }

                      updated[si].rows.push({
                        id: `row_${Date.now()}`,
                        title: "New Option",
                        description: "",
                        nextNode: "",
                      });

                      updateNodeData(node.id, { sections: updated });
                    }}
                  >
                    + Add Row
                  </Button>

                  {/* DELETE SECTION */}
                  <Button
                    color="error"
                    sx={{ ml: 2 }}
                    onClick={() => {
                      const updated = JSON.parse(JSON.stringify(node.data.sections));
                      updated.splice(si, 1);
                      updateNodeData(node.id, { sections: updated });
                    }}
                  >
                    Delete Section
                  </Button>

                </Box>
              </Grid>
            ))}

            {/* ADD SECTION */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => {
                  const updated = node.data.sections || [];

                  updateNodeData("sections", [
                    ...updated,
                    {
                      title: "New Section",
                      rows: [
                        {
                          id: `row_${Date.now()}`,
                          title: "Option 1",
                          description: "",
                          nextNode: "",
                        },
                      ],
                    },
                  ]);
                }}
              >
                + Add Section
              </Button>
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
                updateNodeData(node.id, { message: e.target.value })
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
                updateNodeData(node.id, { message: e.target.value })
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
                  updateNodeData(node.id, { header: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => {
                  const items = node.data.items || [];
                  updateNodeData(node.id, {
                    items: [
                      ...items,
                      {
                        id: `item_${Date.now()}`,
                        title: "New Item",
                        description: "",
                      },
                    ]
                  });
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