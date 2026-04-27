import {
    BaseEdge,
    EdgeProps,
    getBezierPath,
} from "reactflow";

export default function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    selected,
}: EdgeProps) {
    const [path] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    return (
        <>
            {/* 🔥 Glow layer */}
            <BaseEdge
                id={id}
                path={path}
                markerEnd="url(#arrowhead)"
                style={{
                    stroke: "#25D366",
                    strokeWidth: selected ? 6 : 4,
                    opacity: 0.2,
                    filter: "drop-shadow(0 0 6px rgba(37,211,102,0.5))",
                }}
            />

            {/* 🔥 Main line */}
            <BaseEdge
                id={id}
                path={path}
                markerEnd="url(#arrowhead)"
                style={{
                    stroke: "#25D366",
                    strokeWidth: 2,
                    strokeDasharray: "6 6",
                    strokeLinecap: "round",
                    animation: "dash 1s linear infinite",
                    ...style,
                }}
            />

            <style>
                {`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}
            </style>
        </>
    );
}