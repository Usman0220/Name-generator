import React from 'react';
import { WordNode } from '../types';
import Spinner from './Spinner';

interface NodeProps {
  node: WordNode;
  onClick: (id: string) => void;
}

const Node: React.FC<NodeProps> = ({ node, onClick }) => {
  const depthColorClasses = [
    'bg-purple-600 ring-purple-400', // depth 0
    'bg-cyan-600 ring-cyan-400',    // depth 1
    'bg-teal-600 ring-teal-400',     // depth 2
    'bg-blue-600 ring-blue-400',     // depth 3
  ];

  const colorClass = depthColorClasses[node.depth % depthColorClasses.length];

  const handleClick = () => {
    if (!node.isExpanded && !node.isLoading) {
      onClick(node.id);
    }
  };

  const cursorClass = !node.isExpanded ? 'cursor-pointer' : 'cursor-default';
  const hoverClass = !node.isExpanded
    ? 'hover:scale-110 hover:shadow-2xl'
    : '';
  
  const size = Math.max(40, 90 - node.depth * 10);
  const fontSize = Math.max(10, 16 - node.depth * 1.5);

  return (
    <div
      id={node.id}
      className={`absolute flex items-center justify-center p-2 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ring-2 ring-opacity-50 animate-scale-in ${colorClass} ${cursorClass} ${hoverClass}`}
      style={{
        top: node.position.y,
        left: node.position.x,
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${fontSize}px`,
      }}
      onClick={handleClick}
    >
      {node.isLoading ? (
        <Spinner />
      ) : (
        <span className="text-center font-semibold text-white break-words">
          {node.word}
        </span>
      )}
    </div>
  );
};

export default Node;