'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, User, Weight, Calendar, Pill, Plane, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { EligibilityTest } from '@/types';

interface EligibilityTestProps {
  onComplete: (test: EligibilityTest) => void;
  onCancel: () => void;
}

export default function EligibilityTestComponent({ onComplete, onCancel }: EligibilityTestProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [testData, setTestData] = useState({
    age: 0,
    weight: 0,
    lastDonation: '',
    hasIllness: false,
    takesMedication: false,
    hasTraveled: false,
  });

  const questions = [
    {
      id: 'age',
      title: 'Quel est votre âge ?',
      description: 'Vous devez avoir entre 18 et 65 ans pour donner votre sang',
      icon: User,
      type: 'number',
      min: 16,
      max: 70,
      field: 'age'
    },
    {
      id: 'weight',
      title: 'Quel est votre poids ?',
      description: 'Vous devez peser au minimum 50 kg pour donner votre sang',
      icon: Weight,
      type: 'number',
      min: 40,
      max: 200,
      field: 'weight'
    },
    {
      id: 'lastDonation',
      title: 'Quand avez-vous donné votre sang pour la dernière fois ?',
      description: 'Un délai minimum de 8 semaines est requis entre deux dons',
      icon: Calendar,
      type: 'date',
      field: 'lastDonation'
    },
    {
      id: 'illness',
      title: 'Avez-vous une maladie chronique ou êtes-vous actuellement malade ?',
      description: 'Certaines conditions médicales peuvent vous empêcher de donner votre sang',
      icon: AlertCircle,
      type: 'boolean',
      field: 'hasIllness'
    },
    {
      id: 'medication',
      title: 'Prenez-vous actuellement des médicaments ?',
      description: 'Certains médicaments peuvent affecter la qualité du sang donné',
      icon: Pill,
      type: 'boolean',
      field: 'takesMedication'
    },
    {
      id: 'travel',
      title: 'Avez-vous voyagé dans une zone à risque ces 6 derniers mois ?',
      description: 'Certaines destinations peuvent nécessiter une période d\'attente',
      icon: Plane,
      type: 'boolean',
      field: 'hasTraveled'
    }
  ];

  const currentQuestion = questions[currentStep];

  const calculateEligibility = (): EligibilityTest => {
    let score = 100;
    const reasons: string[] = [];

    // Vérification de l'âge
    if (testData.age < 18 || testData.age > 65) {
      score -= 100;
      reasons.push('Âge non conforme (18-65 ans requis)');
    }

    // Vérification du poids
    if (testData.weight < 50) {
      score -= 100;
      reasons.push('Poids insuffisant (minimum 50 kg)');
    }

    // Vérification du dernier don
    if (testData.lastDonation) {
      const lastDonationDate = new Date(testData.lastDonation);
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 semaines

      if (lastDonationDate > eightWeeksAgo) {
        score -= 100;
        reasons.push('Délai insuffisant depuis le dernier don (8 semaines minimum)');
      }
    }

    // Autres vérifications
    if (testData.hasIllness) {
      score -= 50;
      reasons.push('Condition médicale à évaluer');
    }

    if (testData.takesMedication) {
      score -= 30;
      reasons.push('Médication à évaluer');
    }

    if (testData.hasTraveled) {
      score -= 20;
      reasons.push('Voyage récent à évaluer');
    }

    const eligible = score >= 70;

    return {
      age: testData.age,
      weight: testData.weight,
      lastDonation: testData.lastDonation ? new Date(testData.lastDonation) : undefined,
      hasIllness: testData.hasIllness,
      takesMedication: testData.takesMedication,
      hasTraveled: testData.hasTraveled,
      score,
      eligible
    };
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const result = calculateEligibility();
      onComplete(result);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateTestData = (field: string, value: any) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const isCurrentStepValid = () => {
    const question = currentQuestion;
    const value = testData[question.field as keyof typeof testData];
    
    if (question.type === 'number') {
      return (value as number) > 0;
    }
    if (question.type === 'date') {
      return true; // Date peut être vide pour "jamais donné"
    }
    return true; // Boolean est toujours valide
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Heart className="text-white" size={32} />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Test d'Éligibilité au Don
          </h2>
          <p className="text-gray-600">
            Répondez à quelques questions pour vérifier votre éligibilité
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentStep + 1} sur {questions.length}</span>
            <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            {/* @ts-ignore */}
            <motion.div
              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
              <currentQuestion.icon className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {currentQuestion.title}
              </h3>
              <p className="text-sm text-gray-600">
                {currentQuestion.description}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            {currentQuestion.type === 'number' && (
              <Input
                type="number"
                placeholder={currentQuestion.field === 'age' ? 'Votre âge' : 'Votre poids en kg'}
                value={testData[currentQuestion.field as keyof typeof testData] as number || ''}
                onChange={(e) => updateTestData(currentQuestion.field, parseInt(e.target.value) || 0)}
                min={currentQuestion.min}
                max={currentQuestion.max}
                className="text-lg text-center"
              />
            )}

            {currentQuestion.type === 'date' && (
              <div>
                <Input
                  type="date"
                  value={testData[currentQuestion.field as keyof typeof testData] as string}
                  onChange={(e) => updateTestData(currentQuestion.field, e.target.value)}
                  className="text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Laissez vide si vous n'avez jamais donné votre sang
                </p>
              </div>
            )}

            {currentQuestion.type === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateTestData(currentQuestion.field, false)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    testData[currentQuestion.field as keyof typeof testData] === false
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="mx-auto mb-2" size={32} />
                  <span className="font-medium">Non</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateTestData(currentQuestion.field, true)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    testData[currentQuestion.field as keyof typeof testData] === true
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <XCircle className="mx-auto mb-2" size={32} />
                  <span className="font-medium">Oui</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={currentStep === 0 ? onCancel : handlePrevious}
          >
            {currentStep === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
          >
            {currentStep === questions.length - 1 ? 'Terminer le test' : 'Suivant'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
