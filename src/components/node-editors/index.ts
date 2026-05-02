import AskInputEditor from "components/AskInputEditor";
import AutoReplyEditor from "./AutoReplyEditor";
import SetContactAttributeEditor from "components/SetContactAttributeNode";
import GoogleSheetEditor from "./GoogleSheetEditor";

export const NODE_EDITORS: any = {
  auto_reply: AutoReplyEditor,
  list: AutoReplyEditor,
  carousel: AutoReplyEditor,
  ask_input: AskInputEditor,
  set_contact_attribute: SetContactAttributeEditor,
  google_sheet: GoogleSheetEditor,
};