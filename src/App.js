import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { generateClient } from 'aws-amplify/api';
import { createWeightEntry, deleteWeightEntry } from './graphql/mutations';
import { listWeightEntries } from './graphql/queries';


// Calculate TDEE from actual weight loss data using a 4-week moving window
const calculateTDEEFromData = (weightData, dailyCalories, weeksBack = 4) => {
  if (weightData.length < 2) return null;

  // Get the most recent data point and one from ~4 weeks ago
  const latestPoint = weightData[weightData.length - 1];

  // Find a point approximately 4 weeks back
  const targetWeek = latestPoint.weekNumber - weeksBack;
  let earlierPoint = weightData[0];

  for (let i = weightData.length - 1; i >= 0; i--) {
    if (weightData[i].weekNumber <= targetWeek) {
      earlierPoint = weightData[i];
      break;
    }
  }

  // Calculate actual time span and weight loss
  const weeksDiff = latestPoint.weekNumber - earlierPoint.weekNumber;
  const weightLoss = earlierPoint.weight - latestPoint.weight;

  if (weeksDiff <= 0) return null;

  // Calculate daily deficit from observed weight loss
  const totalCalorieDeficit = weightLoss * 3500; // calories
  const days = weeksDiff * 7;
  const dailyDeficit = totalCalorieDeficit / days;

  // TDEE = calories eaten + deficit
  const tdee = dailyCalories + dailyDeficit;

  return {
    tdee: Math.round(tdee),
    dailyDeficit: Math.round(dailyDeficit),
    weeklyLossRate: Math.round((weightLoss / weeksDiff) * 10) / 10,
    weeksAnalyzed: Math.round(weeksDiff * 10) / 10
  };
};

const EliteCyclistWeightTracker = () => {
  const client = generateClient();
  const [showPhases] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [extraData, setExtraData] = useState([]);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const result = await client.graphql({ query: listWeightEntries });
        const items = result.data.listWeightEntries.items;
        setExtraData(items.map(item => ({ id: item.id, date: item.date, weight: item.weight })));
      } catch (err) {
        console.error('Error loading entries:', err);
      }
    };
    loadEntries();
  }, []);


  // calculating week
  const calculateWeekNumber = (dateString) => {
    const parts = dateString.split('/').map(Number);
    const month = parts[0];
    const day = parts[1];
    const year = parts[2] ? (parts[2] < 100 ? 2000 + parts[2] : parts[2]) : 2025;

    const startDate = new Date(2025, 8, 10); // Sept 10, 2025
    const currentDate = new Date(year, month - 1, day);
    const diffTime = currentDate - startDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.round((diffDays / 7) * 10) / 10;
  };

  // fix x-axis alignment
  const actualData = [...extraData]
    .sort((a, b) => {
      const parseDate = (d) => {
        const parts = d.split('/').map(Number);
        const year = parts[2] < 100 ? 2000 + parts[2] : parts[2];
        return new Date(year, parts[0] - 1, parts[1]);
      };
      return parseDate(a.date) - parseDate(b.date);
    })
    .map(entry => {
      const parts = entry.date.split('/').map(Number);
      const month = parts[0];
      const day = parts[1];
      const year = parts[2] ? (parts[2] < 100 ? 2000 + parts[2] : parts[2]) : 2025;
      const dateObj = new Date(year, month - 1, day);

      return {
        ...entry,
        date: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        weekNumber: calculateWeekNumber(entry.date)
      };
    });
  if (actualData.length === 0) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  const currentWeight = actualData[actualData.length - 1].weight;
  const currentWeekNum = actualData[actualData.length - 1].weekNumber;

  // Calculate current TDEE from 4-week moving average
  const tdeeData = calculateTDEEFromData(actualData, 1200, 4);
  const currentTDEE = tdeeData?.tdee || 2000;

  // Calculate projections based on weight, not time
  const allProjections = [];
  let weight = currentWeight;
  let weekNumber = Math.ceil(currentWeekNum);

  // Phase 1: Focused deficit until 200 lbs
  while (weight > 200) {
    const weightDiff = currentWeight - weight;
    const tdeeAdjustment = weightDiff * 22;
    const tdee = currentTDEE - tdeeAdjustment;
    const dailyDeficit = (2.5 * 3500) / 7;
    const dailyCalories = tdee - dailyDeficit;

    const projDate = new Date(2025, 8, 10);
    projDate.setDate(projDate.getDate() + (weekNumber * 7));

    allProjections.push({
      weekNumber: Math.round(weekNumber * 10) / 10,
      weight: Math.round(weight * 10) / 10,
      date: `${projDate.getMonth() + 1}/${projDate.getDate()}`,
      phase: 1,
      tdee: Math.round(tdee),
      dailyCalories: Math.round(dailyCalories),
      deficit: Math.round(dailyDeficit),
      weeklyLoss: 2.5
    });

    weight -= 2.5;
    weekNumber += 1;
  }

  // Phase 2: Training ramp from 200 to 170 lbs
  while (weight > 170) {
    const weightDiff = currentWeight - weight;
    const tdeeAdjustment = weightDiff * 22;
    const tdee = currentTDEE - tdeeAdjustment;
    const dailyDeficit = (1.9 * 3500) / 7;
    const dailyCalories = tdee - dailyDeficit;

    const projDate = new Date(2025, 8, 10);
    projDate.setDate(projDate.getDate() + (weekNumber * 7));

    allProjections.push({
      weekNumber: Math.round(weekNumber * 10) / 10,
      weight: Math.round(weight * 10) / 10,
      date: `${projDate.getMonth() + 1}/${projDate.getDate()}`,
      phase: 2,
      tdee: Math.round(tdee),
      dailyCalories: Math.round(dailyCalories),
      deficit: Math.round(dailyDeficit),
      weeklyLoss: 1.9
    });

    weight -= 1.9;
    weekNumber += 1;
  }

  // Maintenance at 170 until after L'Étape (July 19, 2026)
  const letapeDate = new Date(2026, 6, 19); // July 19, 2026
  const startDate = new Date(2025, 8, 10);
  const letapeWeek = Math.floor((letapeDate - startDate) / (1000 * 60 * 60 * 24 * 7));

  while (weekNumber <= letapeWeek) {
    const weightDiff = currentWeight - 170;
    const tdeeAdjustment = weightDiff * 22;
    const tdee = currentTDEE - tdeeAdjustment;

    const projDate = new Date(2025, 8, 10);
    projDate.setDate(projDate.getDate() + (weekNumber * 7));

    allProjections.push({
      weekNumber: Math.round(weekNumber * 10) / 10,
      weight: 170,
      date: `${projDate.getMonth() + 1}/${projDate.getDate()}`,
      phase: 'maintenance',
      tdee: Math.round(tdee),
      dailyCalories: Math.round(tdee),
      deficit: 0,
      weeklyLoss: 0
    });

    weekNumber += 1;
  }



  // Phase 3: Ideal body composition from 170 to 150 lbs
  weight = 170;
  while (weight > 150) {
    const weightDiff = currentWeight - weight;
    const tdeeAdjustment = weightDiff * 22;
    const tdee = currentTDEE - tdeeAdjustment;
    const dailyDeficit = (0.9 * 3500) / 7;
    const dailyCalories = tdee - dailyDeficit;

    const projDate = new Date(2025, 8, 10);
    projDate.setDate(projDate.getDate() + (weekNumber * 7));

    allProjections.push({
      weekNumber: Math.round(weekNumber * 10) / 10,
      weight: Math.round(weight * 10) / 10,
      date: `${projDate.getMonth() + 1}/${projDate.getDate()}`,
      phase: 3,
      tdee: Math.round(tdee),
      dailyCalories: Math.round(dailyCalories),
      deficit: Math.round(dailyDeficit),
      weeklyLoss: 0.9
    });

    weight -= 0.9;
    weekNumber += 1;
  }

  const finalWeek = allProjections[allProjections.length - 1]?.weekNumber || 60;

  // Create a complete dataset with weekly intervals for x-axis
  const completeWeeklyData = [];
  for (let week = 0; week <= finalWeek; week++) {
    const projDate = new Date(2025, 8, 10);
    projDate.setDate(projDate.getDate() + (week * 7));
    const dateStr = `${projDate.getMonth() + 1}/${projDate.getDate()}`;

    // recorded data
    const actualPoint = actualData.find(d => Math.abs(d.weekNumber - week) < 0.5);

    // projected data
    const projectedPoint = allProjections.find(d => d.weekNumber === week);

    completeWeeklyData.push({
      weekNumber: week,
      date: dateStr,
      weight: actualPoint?.weight,
      projected: projectedPoint?.weight
    });
  }

  const addWeightEntry = async () => {
    if (!newWeight || !newDate) return;
    const dateRegex = /^\d{1,2}\/\d{2}\/\d{2}$/;
    if (!dateRegex.test(newDate)) {
      alert('Date must be in m/dd/yy format (e.g. 2/25/26)');
      return;
    }
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 50 || w > 500) {
      alert('Weight must be a number between 50 and 500 lbs');
      return;
    }
    try {
      const result = await client.graphql({
        query: createWeightEntry,
        variables: { input: { date: newDate, weight: w } }
      });
      const newItem = result.data.createWeightEntry;
      setExtraData([...extraData, { id: newItem.id, date: newItem.date, weight: newItem.weight }]);
      setNewWeight('');
      setNewDate('');
    } catch (err) {
      console.error('Error saving entry:', err);
    }
  };
  const startWeight = actualData[0].weight;
  const totalLoss = startWeight - currentWeight;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Weight Loss Journey</h1>
          <p className="text-xl text-gray-600">
            {255} lbs → 150 lbs | Return to Elite Cycling Weight
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Started Sept 10, 2025 • Week {currentWeekNum.toFixed(1)}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Burn</div>
            <div className="text-3xl font-bold text-purple-600">{totalLoss} lbs</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Current Phase</div>

            <div className="text-2xl font-bold text-blue-600">
              {currentWeight > 200 ? 'Phase 1' : currentWeight > 170 ? 'Phase 2' : 'Phase 3'}
            </div>
            <div className="text-xs text-gray-500">
              {currentWeight > 200 ? 'Focused Fat Loss' : currentWeight > 170 ? 'Training Ramp' : 'Final Approach'}

            </div>

          </div>
          {currentWeight > 200 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">To Onederland</div>
              <div className="text-2xl font-bold text-green-600">{currentWeight - 200} lbs</div>
              <div className="text-xs text-gray-500">obesity to overweight</div>
            </div>
          ) : currentWeight > 170 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">To L'Étape Weight</div>
              <div className="text-2xl font-bold text-orange-600">{currentWeight - 170} lbs</div>
              <div className="text-xs text-gray-500">race-ready weight</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">To Goal Weight</div>
              <div className="text-2xl font-bold text-green-600">{currentWeight - 150} lbs</div>

            </div>
          )}
          {currentWeight > 170 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">L'Étape Goal</div>
              <div className="text-2xl font-bold text-orange-600">170 lbs</div>
              <div className="text-xs text-gray-500">By June 2026</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Goal Weight</div>
              <div className="text-2xl font-bold text-green-600">150 lbs</div>
              <div className="text-xs text-gray-500">End of year</div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Scale Weight</h2>

          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={completeWeeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {/* Shaded zones - must come FIRST to appear in background */}
              {showPhases && (
                <>
                  {/* Horizontal BMI category shading - consistent across entire chart */}
                  <ReferenceArea y1={200} y2={260} fill="#ef4444" fillOpacity={0.1} ifOverflow="extendDomain" />
                  <ReferenceArea y1={170} y2={200} fill="#f97316" fillOpacity={0.1} ifOverflow="extendDomain" />
                  <ReferenceArea y1={150} y2={170} fill="#22c55e" fillOpacity={0.1} ifOverflow="extendDomain" />
                </>
              )}

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="weekNumber"
                type="number"
                domain={[0, Math.ceil(finalWeek / 4) * 4]}
                tick={{ fontSize: 11 }}
                interval={0}
                ticks={Array.from({ length: Math.ceil(finalWeek / 4) + 1 }, (_, i) => i * 4)}
                tickFormatter={(week) => {
                  const projDate = new Date(2025, 8, 10);
                  projDate.setDate(projDate.getDate() + (week * 7));
                  return `${projDate.getMonth() + 1}/${projDate.getDate()}`;
                }}
              />
              <YAxis
                domain={[140, 260]}
                ticks={[150, 170, 200, 220, 240, 260]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                formatter={(value, name) => {
                  if (!value) return ['N/A', name];

                  // Calculate BMI (height is 5'9" = 69 inches)
                  const heightInInches = 69;
                  const bmi = ((value / (heightInInches * heightInInches)) * 703).toFixed(1);

                  return [
                    `${value} lbs (BMI: ${bmi})`,
                    name === 'weight' ? 'Scale Weight' : name === 'projected' ? 'Projected Weight' : name
                  ];
                }}
                labelFormatter={(week) => {
                  const projDate = new Date(2025, 8, 10);
                  projDate.setDate(projDate.getDate() + (week * 7));
                  return `Week ${week} (${projDate.getMonth() + 1}/${projDate.getDate()})`;
                }}
              />
              <Legend />

              {/* Goal lines */}
              <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="3 3" label="Exit Obesity (Phase 2 Start)" />
              <ReferenceLine y={170} stroke="#f97316" strokeDasharray="3 3" label="L'Etape Goal (June)" />
              <ReferenceLine y={150} stroke="#22c55e" strokeDasharray="3 3" label="Elite Race Weight" />

              {/* Projected weight line - red, medium weight, no dots */}
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Projected Weight"
                connectNulls
              />

              {/* recorded data - purple dots */}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 5 }}
                activeDot={{ r: 7 }}
                name="Actual Weight"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* New Entry Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-4">
          <span className="text-gray-600 font-medium">New Scale Weight:</span>
          <input
            type="text"
            placeholder="date (m/dd/yy)"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="border rounded px-3 py-2 text-gray-800 placeholder-gray-300 w-36"
          />
          <input
            type="number"
            placeholder="lbs"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="border rounded px-3 py-2 text-gray-800 placeholder-gray-300 w-24"
          />
          <button
            onClick={addWeightEntry}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Add
          </button>
        </div>
        {/* Phase Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-red-800 mb-3">Phase 1: Focused Fat Loss</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Target:</strong> {255} → 200 lbs (Week {Math.round(currentWeekNum)})</p>
              <p><strong>Rate:</strong> 2.5 lbs/week</p>
              <p><strong>Est. Duration:</strong> {Math.ceil((255 - 200) / 2.5)} weeks</p>
              <p><strong>Strategy:</strong> Aggressive deficit + Z2</p>
              <p><strong>Goal:</strong> Exit obesity</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-orange-800 mb-3">Phase 2: Training Ramp</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Target:</strong> 200 → 170 lbs (30 lbs)</p>
              <p><strong>Rate:</strong> 1.9 lbs/week</p>
              <p><strong>Est. Duration:</strong> {Math.ceil(30 / 1.9)} weeks</p>
              <p><strong>Strategy:</strong> Progressive Overload + calories for training</p>
              <p><strong>Goal:</strong> Race-ready for L'Etape</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-green-800 mb-3">Phase 3: Final Approach</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Target:</strong> 170 → 150 lbs (20 lbs)</p>
              <p><strong>Rate:</strong> 0.9 lbs/week</p>
              <p><strong>Est. Duration:</strong> {Math.ceil(20 / 0.9)} weeks</p>
              <p><strong>Strategy:</strong> Moderate deficit + training</p>
              <p><strong>Goal:</strong> Ideal body composition</p>
            </div>
          </div>
        </div>

        {/* Footer overview */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Former elite cyclist returning to form | 5'9" | Race weight: 150-165 lbs</p>
          <p className="mt-1">Monitoring: Blood glucose, heart rate, hematocrit | Daily workouts | Home cookin'</p>
          <p className="mt-1 italic">Projections based on 4-week moving average TDEE with metabolic adaptation (22 cal/lb decline)</p>
        </div>
      </div>
    </div>
  );
};

export default EliteCyclistWeightTracker;