'use client';

import { motion } from 'framer-motion';
import { BloodType } from '@/types';

interface BloodTypeData {
  bloodType: BloodType;
  count: number;
  percentage: number;
  color: string;
}

interface BloodTypeChartProps {
  data: BloodTypeData[];
}

const BloodTypeChart = ({ data }: BloodTypeChartProps) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Si pas de données, afficher un message
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-gray-200 flex items-center justify-center">
            <span className="text-gray-400">0%</span>
          </div>
          <p>Aucune poche en stock</p>
        </div>
      </div>
    );
  }

  let currentAngle = 0;
  const radius = 80;
  const centerX = 120;
  const centerY = 120;
  
  const createPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="bg-white rounded-xl p-6 border">
      <h4 className="text-lg font-semibold text-gray-900 mb-6 text-center">
        Répartition par Groupe Sanguin
      </h4>
      
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Diagramme circulaire */}
        <div className="relative">
          <svg width="240" height="240" className="transform -rotate-90">
            {data.map((item, index) => {
              if (item.count === 0) return null;
              
              const angle = (item.count / total) * 360;
              const path = createPath(currentAngle, currentAngle + angle);
              const pathToReturn = (
                <motion.path
                  key={item.bloodType}
                  d={path}
                  fill={item.color}
                  stroke="white"
                  strokeWidth="2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.6,
                    ease: "easeOut"
                  }}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              );
              currentAngle += angle;
              return pathToReturn;
            })}
          </svg>
          
          {/* Cercle central avec total */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full w-24 h-24 border-4 border-gray-100 flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-gray-800">{total}</span>
              <span className="text-xs text-gray-500">Total</span>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            {data.map((item, index) => (
              <motion.div
                key={item.bloodType}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{item.bloodType}</span>
                    <span className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.count} poche{item.count > 1 ? 's' : ''}
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <motion.div
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodTypeChart;
