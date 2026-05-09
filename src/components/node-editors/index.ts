import AskInputEditor from "components/AskInputEditor";
import AutoReplyEditor from "./AutoReplyEditor";
import SetContactAttributeEditor from "components/SetContactAttributeNode";
import GoogleSheetEditor from "./GoogleSheetEditor";
import IntegrationActionEditor from "./IntegrationActionEditor";
import BuiltinNodeEditor from "./BuiltinNodeEditor";
import ProductNodeEditor from "./ProductNodeEditor";

export const NODE_EDITORS: any = {
  auto_reply: AutoReplyEditor,
  list: AutoReplyEditor,
  carousel: AutoReplyEditor,
  ask_input: AskInputEditor,
  set_contact_attribute: SetContactAttributeEditor,
  google_sheet: GoogleSheetEditor,
  integration_action: IntegrationActionEditor,
  single_product: ProductNodeEditor,
  product_list: ProductNodeEditor,
  ask_location: BuiltinNodeEditor,
  address_message: BuiltinNodeEditor,
  distance_check: BuiltinNodeEditor,
  call_to_action: BuiltinNodeEditor,
  api_request: BuiltinNodeEditor,
  send_flow: BuiltinNodeEditor,
  send_template: BuiltinNodeEditor,
};
