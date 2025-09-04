'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BloodLiquidIndicatorProps {
  bloodType: string;
  count: number;
  maxCount?: number;
  level: 'critical' | 'low' | 'normal' | 'high';
}

const bloodColors = {
  'A+': '#DC2626', 'A-': '#DC2626',
  'B+': '#7C3AED', 'B-': '#7C3AED', 
  'AB+': '#059669', 'AB-': '#059669',
  'O+': '#EA580C', 'O-': '#EA580C'
};

const levelColors = {
  critical: '#DC2626',
  low: '#F59E0B', 
  normal: '#10B981',
  high: '#059669'
};

export default function BloodLiquidIndicator({ 
  bloodType, 
  count, 
  maxCount = 20, 
  level 
}: BloodLiquidIndicatorProps) {
  const [animatedCount, setAnimatedCount] = useState(0);
  const percentage = Math.min((count / maxCount) * 100, 100);
  const liquidColor = levelColors[level];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCount(count);
    }, 200);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100 opacity-50" />
      
      {/* Liquid animation container */}
      <div className="relative h-36 mb-4 bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden">
        {/* Liquid fill with sloshing animation */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{ 
            backgroundColor: liquidColor,
            boxShadow: `0 0 20px ${liquidColor}40`,
            borderRadius: '0 0 12px 12px'
          }}
          initial={{ height: '0%' }}
          animate={{ height: `${percentage}%` }}
          transition={{ 
            duration: 1.5, 
            ease: "easeOut",
            delay: 0.2 
          }}
        >
          {/* Main liquid surface with sloshing */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${liquidColor}CC 0%, ${liquidColor} 100%)`,
            }}
            animate={{
              borderRadius: [
                '0 0 12px 12px',
                '0 0 8px 16px', 
                '0 0 16px 8px',
                '0 0 12px 12px'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Liquid wave surface */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-4"
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%)`
              }}
              animate={{
                transform: [
                  'translateY(0px) scaleY(1)',
                  'translateY(-2px) scaleY(0.8)',
                  'translateY(2px) scaleY(1.2)',
                  'translateY(0px) scaleY(1)'
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Liquid wave effect */}
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)`
            }}
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Surface shimmer */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
            }}
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          
          {/* Bubbles effect */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                left: `${20 + i * 25}%`,
                bottom: `${10 + i * 15}%`
              }}
              animate={{
                y: [0, -20, 0],
                scale: [0.5, 1, 0.5],
                opacity: [0.6, 0.9, 0.6]
              }}
              transition={{
                duration: 1.5 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
            />
          ))}

          {/* Side liquid movement */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(135deg, ${liquidColor} 0%, transparent 50%, ${liquidColor} 100%)`
            }}
            animate={{
              skewX: [-2, 2, -2],
              scaleX: [1, 1.02, 1]
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Text overlay on liquid */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.div 
            className={`text-2xl font-bold mb-1 drop-shadow-lg ${
              level === 'critical' ? 'text-red-500' :
              level === 'low' ? 'text-yellow-500' :
              level === 'normal' ? 'text-green-500' : 'text-green-600'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {bloodType}
          </motion.div>
          
          <motion.div 
            className={`text-3xl font-bold drop-shadow-lg mb-1 ${
              level === 'critical' ? 'text-red-500' :
              level === 'low' ? 'text-yellow-500' :
              level === 'normal' ? 'text-green-500' : 'text-green-600'
            }`}
            key={animatedCount}
            initial={{ scale: 1.2, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {animatedCount}
          </motion.div>
          
          <div className={`text-xs font-medium uppercase tracking-wide drop-shadow ${
            level === 'critical' ? 'text-red-500' :
            level === 'low' ? 'text-yellow-500' :
            level === 'normal' ? 'text-green-500' : 'text-green-600'
          }`}>
            {level === 'critical' ? 'Critique' :
             level === 'low' ? 'Faible' :
             level === 'normal' ? 'Normal' : 'Élevé'}
          </div>
        </div>

        {/* Drop effect when count increases */}
        {count > 0 && (
          <motion.div
            key={count}
            className="absolute top-2 left-1/2 w-2 h-2 rounded-full"
            style={{ backgroundColor: liquidColor }}
            initial={{ 
              y: -20, 
              x: -4, 
              scale: 0.5,
              opacity: 0.8 
            }}
            animate={{ 
              y: 20, 
              scale: [0.5, 1, 0.5],
              opacity: [0.8, 1, 0] 
            }}
            transition={{ 
              duration: 0.8,
              ease: "easeIn"
            }}
          />
        )}
      </div>

      {/* Percentage indicator */}
      <div className="text-center mt-2">
        <div className="text-xs text-gray-500">
          {percentage.toFixed(0)}% de capacité
        </div>
      </div>

      {/* Pulse effect for critical levels */}
      {level === 'critical' && (
        <motion.div
          className="absolute inset-0 border-2 border-red-500 rounded-2xl"
          animate={{
            opacity: [0, 0.3, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
}
