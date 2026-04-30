export const handleButtonAction = (btn: any) => {
  switch (btn.type) {
    case "call":
      if (!btn.phone_number) return;
      window.location.href = `tel:${btn.phone_number}`;
      break;

    case "url":
      if (!btn.url) return;
      window.open(btn.url, "_blank");
      break;

    case "quick_reply":
      // existing logic
      console.log("Reply clicked:", btn.id);
      break;

    case "flow":
      console.log("Flow triggered:", btn.flowId);
      break;

    default:
      console.warn("Unknown button type:", btn.type);
  }
};