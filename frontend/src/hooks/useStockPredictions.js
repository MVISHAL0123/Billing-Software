import { useState, useEffect } from 'react';

export const useStockPredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock AI predictions for demonstration
        const mockPredictions = [
          {
            id: 1,
            product: 'Rice 25kg',
            currentStock: 5,
            predictedStock: 2,
            urgency: 'Critical',
            confidence: 0.95,
            dailyUsage: 2.5,
            daysUntilStockout: 2,
            supplierInfo: {
              name: 'Tamil Nadu Rice Mills',
              deliveryTime: '2-3 days'
            }
          },
          {
            id: 2,
            product: 'Wheat Flour 10kg',
            currentStock: 15,
            predictedStock: 8,
            urgency: 'Low',
            confidence: 0.88,
            dailyUsage: 3.2,
            daysUntilStockout: 5,
            supplierInfo: {
              name: 'Flour Master Suppliers',
              deliveryTime: '1-2 days'
            }
          },
          {
            id: 3,
            product: 'Sugar 1kg',
            currentStock: 25,
            predictedStock: 18,
            urgency: 'Medium',
            confidence: 0.92,
            dailyUsage: 1.8,
            daysUntilStockout: 14,
            supplierInfo: {
              name: 'Sweet Home Sugar Co.',
              deliveryTime: '3-4 days'
            }
          },
          {
            id: 4,
            product: 'Cooking Oil 1L',
            currentStock: 8,
            predictedStock: 3,
            urgency: 'Low',
            confidence: 0.89,
            dailyUsage: 2.1,
            daysUntilStockout: 4,
            supplierInfo: {
              name: 'Golden Oil Distributors',
              deliveryTime: '2-3 days'
            }
          },
          {
            id: 5,
            product: 'Dal Toor 1kg',
            currentStock: 12,
            predictedStock: 6,
            urgency: 'Medium',
            confidence: 0.91,
            dailyUsage: 2.8,
            daysUntilStockout: 4,
            supplierInfo: {
              name: 'Pulse Paradise',
              deliveryTime: '1-2 days'
            }
          }
        ];

        setPredictions(mockPredictions);
        setError(null);
      } catch (err) {
        setError('Failed to fetch stock predictions');
        console.error('Error fetching predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  // Function to refresh predictions manually
  const refreshPredictions = async () => {
    setLoading(true);
    try {
      // In a real app, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update predictions with new data (mock implementation)
      setPredictions(prev => prev.map(p => ({
        ...p,
        currentStock: p.currentStock - Math.random() * 2, // Simulate stock usage
        predictedStock: Math.max(0, p.predictedStock - Math.random()),
        confidence: Math.min(1, p.confidence + (Math.random() - 0.5) * 0.1)
      })));
      
      setError(null);
    } catch (err) {
      setError('Failed to refresh predictions');
    } finally {
      setLoading(false);
    }
  };

  // Calculate urgency based on current stock and usage
  const calculateUrgency = (currentStock, dailyUsage) => {
    const daysUntilStockout = currentStock / dailyUsage;
    
    if (daysUntilStockout <= 2) return 'Critical';
    if (daysUntilStockout <= 5) return 'Low';
    if (daysUntilStockout <= 14) return 'Medium';
    return 'Good';
  };

  // Get predictions filtered by urgency
  const getCriticalPredictions = () => {
    return predictions.filter(p => p.urgency === 'Critical');
  };

  const getLowStockPredictions = () => {
    return predictions.filter(p => ['Critical', 'Low'].includes(p.urgency));
  };

  return {
    predictions,
    loading,
    error,
    refreshPredictions,
    getCriticalPredictions,
    getLowStockPredictions,
    calculateUrgency
  };
};

export default useStockPredictions;