import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

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
  const [showPhases, setShowPhases] = useState(true);

  // Weigh in data
  const rawData = [
    { date: '9/10', weight: 255 },
    { date: '9/22', weight: 245 },
    { date: '10/9', weight: 238 },
    { date: '10/16', weight: 235 },
    { date: '10/19', weight: 234 },
    { date: '10/22', weight: 233 },
    { date: '10/25', weight: 231 },
    { date: '10/29', weight: 229 },
    { date: '10/31', weight: 228 },
    { date: '11/2', weight: 227 },
    { date: '11/3', weight: 226 },
    { date: '11/6', weight: 226 },
    { date: '11/10', weight: 225 },
    { date: '11/14', weight: 223 },
    { date: '11/15', weight: 222 },
    { date: '11/18', weight: 220 },
    { date: '11/25', weight: 218 },
    { date: '11/26', weight: 217 },
    { date: '11/29', weight: 216 },
    { date: '12/05', weight: 214 },
    { date: '12/12', weight: 213 }
  ];

  // calculating week
  const calculateWeekNumber = (dateString) => {
    const [month, day] = dateString.split('/').map(Number);
    const startDate = new Date(2025, 8, 10); // Sept 10, 2025
    const currentDate = new Date(2025, month - 1, day);
    const diffTime = currentDate - startDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.round((diffDays / 7) * 10) / 10;
  };

  // Add this to fix x-axis alignment
  const actualData = rawData.map(entry => {
    const [month, day] = entry.date.split('/').map(Number);
    const dateObj = new Date(2025, month - 1, day);

    return {
      ...entry,
      date: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,  // normalize format
      weekNumber: calculateWeekNumber(entry.date)
    };
  });

  const currentWeight = actualData[actualData.length - 1].weight;
  const currentWeekNum = actualData[actualData.length - 1].weekNumber;

  // Calculate current TDEE from 4-week moving average
  const tdeeData = calculateTDEEFromData(actualData, 1200, 4);
  const currentTDEE = tdeeData?.tdee || 2000; // fallback if not enough data

  // Calculate projections based on WEIGHT milestones, not time
  const allProjections = [];
  let weight = currentWeight;
  let weekNumber = Math.ceil(currentWeekNum);

  // Phase 1: Aggressive deficit until 200 lbs
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

  // Phase 3: Final approach from 170 to 150 lbs
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

    // Find actual data for this week
    const actualPoint = actualData.find(d => Math.abs(d.weekNumber - week) < 0.5);

    // Find projected data for this week
    const projectedPoint = allProjections.find(d => d.weekNumber === week);

    completeWeeklyData.push({
      weekNumber: week,
      date: dateStr,
      weight: actualPoint?.weight,
      projected: projectedPoint?.weight
    });
  }

  const startWeight = actualData[0].weight;
  const totalLoss = startWeight - currentWeight;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Weight Loss Journey</h1>
          <p className="text-xl text-gray-600">
            {currentWeight} lbs → 150 lbs | Return to Elite Cycling Weight
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Started Sept 10, 2025 • Week {currentWeekNum.toFixed(1)}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Lost</div>
            <div className="text-3xl font-bold text-purple-600">{totalLoss} lbs</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Current Phase</div>
            <div className="text-2xl font-bold text-blue-600">Phase 1</div>
            <div className="text-xs text-gray-500">Rapid Fat Loss</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">To Overweight</div>
            <div className="text-2xl font-bold text-green-600">{currentWeight - 200} lbs</div>
            <div className="text-xs text-gray-500">Exit obesity range</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">L'Etape Goal</div>
            <div className="text-2xl font-bold text-orange-600">170 lbs</div>
            <div className="text-xs text-gray-500">By June 2026</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Weight Trajectory</h2>
            <button
              onClick={() => setShowPhases(!showPhases)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              {showPhases ? 'Hide' : 'Show'} Phase Zones
            </button>
          </div>

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
                  return [
                    `${value} lbs`,
                    name === 'weight' ? 'Actual Weight' : name === 'projected' ? 'Projected Weight' : name
                  ];
                }}
                labelFormatter={(week) => `Week ${week}`}
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

              {/* Actual data - purple dots */}
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

        {/* Phase Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-red-800 mb-3">Phase 1: Rapid Fat Loss</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Target:</strong> {currentWeight} → 200 lbs</p>
              <p><strong>Rate:</strong> 2.5 lbs/week</p>
              <p><strong>Est. Duration:</strong> {Math.ceil((currentWeight - 200) / 2.5)} weeks</p>
              <p><strong>Strategy:</strong> Maintain aggressive deficit</p>
              <p><strong>Goal:</strong> Exit obesity range</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-orange-800 mb-3">Phase 2: Training Ramp</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Target:</strong> 200 → 170 lbs (30 lbs)</p>
              <p><strong>Rate:</strong> 1.9 lbs/week</p>
              <p><strong>Est. Duration:</strong> {Math.ceil(30 / 1.9)} weeks</p>
              <p><strong>Strategy:</strong> More calories for training</p>
              <p><strong>Goal:</strong> Race-ready for L'Etape</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-green-800 mb-3">Phase 3: Final Approach</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Target:</strong> 170 → 150 lbs (20 lbs)</p>
              <p><strong>Rate:</strong> 0.9 lbs/week</p>
              <p><strong>Est. Duration:</strong> {Math.ceil(20 / 0.9)} weeks</p>
              <p><strong>Strategy:</strong> Sustainable deficit + training</p>
              <p><strong>Goal:</strong> Return to elite racing weight</p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🚴‍♀️ Former elite cyclist returning to form | 5'9" | Race weight: 150-165 lbs</p>
          <p className="mt-1">Monitoring: Blood glucose, heart rate, hematocrit | Daily workouts | Self-prepared meals</p>
          <p className="mt-1 italic">Projections based on 4-week moving average TDEE with metabolic adaptation (22 cal/lb decline)</p>
        </div>
      </div>
    </div>
  );
};

export default EliteCyclistWeightTracker;
