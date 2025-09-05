import React, { useRef, useEffect } from 'react';
import { WordNode } from '../types';
import Node from './Node';

interface MindMapProps {
  nodes: Record<string, WordNode>;
  onNodeClick: (id: string) => void;
  mapSize: number;
}

// Shared function to ensure consistent sizing between nodes and lines
const getNodeSize = (depth: number) => {
    return Math.max(40, 90 - depth * 10);
};

const MindMap: React.FC<MindMapProps> = ({ nodes, onNodeClick, mapSize }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeValues = Object.values(nodes);

  useEffect(() => {
    if (containerRef.current) {
        if (nodeValues.length === 1) {
             const rootNode = nodeValues[0];
             const targetElement = document.getElementById(rootNode.id);
             targetElement?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        } else {
            const lastExpandedNode = nodeValues.find(n => n.isLoading);
            if(lastExpandedNode) {
                const targetElement = document.getElementById(lastExpandedNode.id);
                targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }
    }
  }, [nodes, nodeValues]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing">
      <div
        className="relative"
        style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
      >
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none animate-fade-in" style={{ animationDelay: '200ms' }}>
          {nodeValues.map((node) => {
            const parent = node.parentId ? nodes[node.parentId] : null;
            if (!parent) return null;

            // Vector from parent to node
            const dx = node.position.x - parent.position.x;
            const dy = node.position.y - parent.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Radii
            const parentRadius = getNodeSize(parent.depth) / 2;
            const nodeRadius = getNodeSize(node.depth) / 2;
            
            if (dist <= parentRadius + nodeRadius) {
                return null;
            }

            // Calculate start and end points on the circumference of the nodes
            const startX = parent.position.x + (dx / dist) * parentRadius;
            const startY = parent.position.y + (dy / dist) * parentRadius;
            const endX = node.position.x - (dx / dist) * nodeRadius;
            const endY = node.position.y - (dy / dist) * nodeRadius;

            // --- Create a curved path instead of a straight line ---
            const vecX = endX - startX;
            const vecY = endY - startY;
            const vecLen = Math.sqrt(vecX * vecX + vecY * vecY);
            
            // Midpoint
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // Perpendicular vector
            const perpX = -vecY / vecLen;
            const perpY = vecX / vecLen;
            
            // Adjust curve amount based on line length, with a max
            const curveFactor = Math.min(vecLen * 0.2, 30);
            
            const controlX = midX + perpX * curveFactor;
            const controlY = midY + perpY * curveFactor;

            const pathD = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;

            return (
              <path
                key={`${parent.id}-${node.id}`}
                d={pathD}
                className="stroke-cyan-500/40"
                strokeWidth="2"
                fill="none"
              />
            );
          })}
        </svg>

        {nodeValues.map((node) => (
          <Node key={node.id} node={node} onClick={onNodeClick} />
        ))}
      </div>
    </div>
  );
};

export default MindMap;