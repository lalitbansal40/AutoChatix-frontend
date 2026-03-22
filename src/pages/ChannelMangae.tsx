import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import TamplatesTab from "components/TemplatesTab";
import WhatsappFlowTab from "components/WhatsappFlowTab";

interface TabItem {
    label: string;
    component: React.ReactNode;
}

const ChannelManage = () => {
    const [tab, setTab] = useState(0);

    // 🔥 Dynamic tabs config (future-proof)
    const tabs: TabItem[] = [
        {
            label: "Templates",
            component: <TamplatesTab />,
        },
        {
            label: "WhatsApp Flow",
            component: <WhatsappFlowTab />,
        },

        // 👉 Future me add kar sakte ho
        // {
        //   label: "Analytics",
        //   component: <AnalyticsTab />,
        // },
    ];

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    return (
        <Box>
            <Tabs value={tab} onChange={handleChange}>
                {tabs.map((t, index) => (
                    <Tab key={index} label={t.label} />
                ))}
            </Tabs>

            {/* Tabs Content */}
            <Box mt={3}>
                {tabs[tab]?.component}
            </Box>
        </Box>
    );
};

export default ChannelManage;