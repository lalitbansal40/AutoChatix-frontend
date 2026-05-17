import AskInputEditor from "components/AskInputEditor";
import AutoReplyEditor from "./AutoReplyEditor";
import SetContactAttributeEditor from "components/SetContactAttributeNode";
import GoogleSheetEditor from "./GoogleSheetEditor";
import IntegrationActionEditor from "./IntegrationActionEditor";
import BuiltinNodeEditor from "./BuiltinNodeEditor";
import ProductNodeEditor from "./ProductNodeEditor";
import ApiRequestEditor from "./ApiRequestEditor";
import AiResponseEditor from "./AiResponseEditor";
import WhatsAppNotificationEditor from "./WhatsAppNotificationEditor";
import ConditionRouterEditor from "./ConditionRouterEditor";
import EvalNodeEditor from "./EvalNodeEditor";

export const NODE_EDITORS: any = {
  eval: EvalNodeEditor,
  condition_router: ConditionRouterEditor,
  auto_reply: AutoReplyEditor,
  list: AutoReplyEditor,
  carousel: AutoReplyEditor,
  ask_input: AskInputEditor,
  set_contact_attribute: SetContactAttributeEditor,
  google_sheet: GoogleSheetEditor,
  integration_action: IntegrationActionEditor,
  single_product: ProductNodeEditor,
  product_list: ProductNodeEditor,
  api_request: ApiRequestEditor,
  ai_response: AiResponseEditor,
  ask_location: BuiltinNodeEditor,
  address_message: BuiltinNodeEditor,
  distance_check: BuiltinNodeEditor,
  call_to_action: BuiltinNodeEditor,
  send_flow: BuiltinNodeEditor,
  send_template: WhatsAppNotificationEditor,
  broadcast_message: WhatsAppNotificationEditor,
  razorpay_payment: BuiltinNodeEditor,
  whatsapp_payment: BuiltinNodeEditor,
  payment_summary: BuiltinNodeEditor,
  update_order: BuiltinNodeEditor,
};
