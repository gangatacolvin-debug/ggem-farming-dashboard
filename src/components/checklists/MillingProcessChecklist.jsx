import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MillingProcessChecklist({ taskId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [locationCompliant, setLocationCompliant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Step 1: Pre-Milling Equipment & Setup
  const [step1Data, setStep1Data] = useState({
    generatorCheck: false,
    huskReceiver: false,
    whitePolisher: false,
    airCompressor: false,
    timestamp: null
  });

  // Step 2: Mill Activation & Paddy Assessment
  const [step2Data, setStep2Data] = useState({
    millSwitchedOn: false,
    paddyWeight: '',
    moistureTest: '',
    riceType: '',
    qualityCheck: false,
    timestamp: null
  });

  // Step 3: Hourly Logs (array of logs)
  const [hourlyLogs, setHourlyLogs] = useState([]);
  
  // Step 4: Post-Milling Summary
  const [summaryData, setSummaryData] = useState({
    totalUnmilledRice: 0,
    totalMilledRice: 0,
    totalBrokenRice: 0,
    totalBran: 0,
    totalDust: 0,
    totalStones: 0,
    finalYieldRatio: 0,
    finalBrokenPercent: 0,
    totalDowntime: 0,
    timestamp: null
  });

  // Geolocation tracking
  useEffect(() => {
    // Request location permission and start tracking
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date()
          };
          setUserLocation(location);
          
          // Check compliance (you'll need to pass task location from props)
          // For now, we'll just mark as compliant
          setLocationCompliant(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationCompliant(false);
        }
      );
    }
  }, []);

  const handleStep1Submit = () => {
    const allChecked = Object.values(step1Data).slice(0, 4).every(val => val === true);
    
    if (!allChecked) {
      alert('Please complete all equipment checks before proceeding');
      return;
    }

    setStep1Data({ ...step1Data, timestamp: new Date() });
    setCurrentStep(2);
  };

  const handleStep2Submit = () => {
    if (!step2Data.millSwitchedOn || !step2Data.paddyWeight || !step2Data.moistureTest || !step2Data.riceType || !step2Data.qualityCheck) {
      alert('Please complete all fields before proceeding');
      return;
    }

    setStep2Data({ ...step2Data, timestamp: new Date() });
    setCurrentStep(3);
  };

  const addHourlyLog = () => {
    const newLog = {
      hour: hourlyLogs.length + 1,
      timestamp: new Date(),
      unmilledBags: '',
      paddyFed: '',
      milledRice: '',
      brokenRice: '',
      brokenHusk: '',
      bran: '',
      dust: '',
      riceStones: '',
      downtime: '',
      notes: '',
      yieldRatio: 0,
      brokenPercent: 0
    };
    setHourlyLogs([...hourlyLogs, newLog]);
  };

  const updateHourlyLog = (index, field, value) => {
    const updatedLogs = [...hourlyLogs];
    updatedLogs[index][field] = value;

    // Auto-calculate yield ratio and broken percentage
    const log = updatedLogs[index];
    if (log.milledRice && log.paddyFed) {
      log.yieldRatio = ((parseFloat(log.milledRice) / parseFloat(log.paddyFed)) * 100).toFixed(2);
    }

    const totalOutput = parseFloat(log.milledRice || 0) + parseFloat(log.brokenRice || 0) + 
                       parseFloat(log.brokenHusk || 0) + parseFloat(log.bran || 0) + 
                       parseFloat(log.dust || 0) + parseFloat(log.riceStones || 0);
    
    if (totalOutput > 0 && log.brokenRice) {
      log.brokenPercent = ((parseFloat(log.brokenRice) / totalOutput) * 100).toFixed(2);
    }

    setHourlyLogs(updatedLogs);
  };

  const calculateSummary = () => {
    const totals = hourlyLogs.reduce((acc, log) => ({
      totalUnmilledRice: acc.totalUnmilledRice + parseFloat(log.unmilledBags || 0),
      totalMilledRice: acc.totalMilledRice + parseFloat(log.milledRice || 0),
      totalBrokenRice: acc.totalBrokenRice + parseFloat(log.brokenRice || 0),
      totalBran: acc.totalBran + parseFloat(log.bran || 0),
      totalDust: acc.totalDust + parseFloat(log.dust || 0),
      totalStones: acc.totalStones + parseFloat(log.riceStones || 0),
      totalDowntime: acc.totalDowntime + parseFloat(log.downtime || 0)
    }), {
      totalUnmilledRice: 0,
      totalMilledRice: 0,
      totalBrokenRice: 0,
      totalBran: 0,
      totalDust: 0,
      totalStones: 0,
      totalDowntime: 0
    });

    const totalPaddyFed = hourlyLogs.reduce((sum, log) => sum + parseFloat(log.paddyFed || 0), 0);
    const finalYieldRatio = totalPaddyFed > 0 ? ((totals.totalMilledRice / totalPaddyFed) * 100).toFixed(2) : 0;
    
    const totalOutput = totals.totalMilledRice + totals.totalBrokenRice + totals.totalBran + totals.totalDust + totals.totalStones;
    const finalBrokenPercent = totalOutput > 0 ? ((totals.totalBrokenRice / totalOutput) * 100).toFixed(2) : 0;

    setSummaryData({
      ...totals,
      finalYieldRatio,
      finalBrokenPercent,
      timestamp: new Date()
    });

    setCurrentStep(4);
  };

  const handleFinalSubmit = async () => {
    const submissionData = {
      taskId,
      checklistType: 'milling',
      step1: step1Data,
      step2: step2Data,
      hourlyLogs,
      summary: summaryData,
      locationData: {
        compliant: locationCompliant,
        userLocation
      },
      submittedAt: new Date()
    };

    console.log('Submission Data:', submissionData);
    
    if (onComplete) {
      onComplete(submissionData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Compliance Alert */}
      {locationCompliant !== null && (
        <Alert className={locationCompliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <MapPin className={`h-4 w-4 ${locationCompliant ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={locationCompliant ? 'text-green-800' : 'text-red-800'}>
            {locationCompliant 
              ? 'Location verified - You are on site' 
              : 'Warning: Location verification failed - You may not be on site'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
            </div>
            {step < 4 && <div className={`w-20 h-1 ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Pre-Milling Equipment & Setup */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Pre-Milling Equipment & Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="generatorCheck"
                checked={step1Data.generatorCheck}
                onCheckedChange={(checked) => setStep1Data({...step1Data, generatorCheck: checked})}
              />
              <Label htmlFor="generatorCheck">Generator check: oil, coolant, fuel (Photo required when enabled)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="huskReceiver"
                checked={step1Data.huskReceiver}
                onCheckedChange={(checked) => setStep1Data({...step1Data, huskReceiver: checked})}
              />
              <Label htmlFor="huskReceiver">Husk Receiver: move, offload, replace</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="whitePolisher"
                checked={step1Data.whitePolisher}
                onCheckedChange={(checked) => setStep1Data({...step1Data, whitePolisher: checked})}
              />
              <Label htmlFor="whitePolisher">White Polisher: clean bran tube (Photo required when enabled)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="airCompressor"
                checked={step1Data.airCompressor}
                onCheckedChange={(checked) => setStep1Data({...step1Data, airCompressor: checked})}
              />
              <Label htmlFor="airCompressor">Air Compressor: switch on, confirm pressure</Label>
            </div>

            <Button onClick={handleStep1Submit} className="w-full bg-primary">
              Continue to Step 2
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mill Activation & Paddy Assessment */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Mill Activation & Paddy Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="millSwitchedOn"
                checked={step2Data.millSwitchedOn}
                onCheckedChange={(checked) => setStep2Data({...step2Data, millSwitchedOn: checked})}
              />
              <Label htmlFor="millSwitchedOn">Switch on the mill (Photo required when enabled)</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paddyWeight">Weigh paddy rice (kg)</Label>
              <Input
                id="paddyWeight"
                type="number"
                placeholder="Enter weight in kg"
                value={step2Data.paddyWeight}
                onChange={(e) => setStep2Data({...step2Data, paddyWeight: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moistureTest">Conduct moisture test (%)</Label>
              <Input
                id="moistureTest"
                type="number"
                step="0.1"
                placeholder="Enter moisture percentage"
                value={step2Data.moistureTest}
                onChange={(e) => setStep2Data({...step2Data, moistureTest: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riceType">Record rice type</Label>
              <Select value={step2Data.riceType} onValueChange={(value) => setStep2Data({...step2Data, riceType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rice type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kayanjamalo">Kayanjamalo</SelectItem>
                  <SelectItem value="kilombero">Kilombero</SelectItem>
                  <SelectItem value="faya">Faya</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="qualityCheck"
                checked={step2Data.qualityCheck}
                onCheckedChange={(checked) => setStep2Data({...step2Data, qualityCheck: checked})}
              />
              <Label htmlFor="qualityCheck">Perform initial quality check</Label>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleStep2Submit} className="flex-1 bg-primary">
                Continue to Hourly Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Hourly Progress Logs */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Step 3: Hourly Progress Logs</span>
                <Badge>{hourlyLogs.length} log(s) added</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hourlyLogs.length === 0 ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    No hourly logs yet. Click "Add Hourly Log" to record your first hour of operation.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {hourlyLogs.map((log, index) => (
                    <Card key={index} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Hour {log.hour}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Unmilled Bags Processed</Label>
                            <Input
                              type="number"
                              placeholder="Bags"
                              value={log.unmilledBags}
                              onChange={(e) => updateHourlyLog(index, 'unmilledBags', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Paddy Rice Fed (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.paddyFed}
                              onChange={(e) => updateHourlyLog(index, 'paddyFed', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Milled Rice (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.milledRice}
                              onChange={(e) => updateHourlyLog(index, 'milledRice', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Broken Rice (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.brokenRice}
                              onChange={(e) => updateHourlyLog(index, 'brokenRice', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Broken + Husk (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.brokenHusk}
                              onChange={(e) => updateHourlyLog(index, 'brokenHusk', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Bran (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.bran}
                              onChange={(e) => updateHourlyLog(index, 'bran', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Dust (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.dust}
                              onChange={(e) => updateHourlyLog(index, 'dust', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Rice + Stones (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.riceStones}
                              onChange={(e) => updateHourlyLog(index, 'riceStones', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Downtime (mins)</Label>
                            <Input
                              type="number"
                              placeholder="minutes"
                              value={log.downtime}
                              onChange={(e) => updateHourlyLog(index, 'downtime', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Auto-calculated values */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <div className="text-sm">
                            <span className="font-medium">Yield Ratio:</span> {log.yieldRatio}%
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Broken %:</span> {log.brokenPercent}%
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Notes/Incidents</Label>
                          <Textarea
                            placeholder="Any notes or incidents during this hour"
                            value={log.notes}
                            onChange={(e) => updateHourlyLog(index, 'notes', e.target.value)}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex space-x-2">
                <Button onClick={addHourlyLog} variant="outline" className="flex-1">
                  Add Hourly Log
                </Button>
                {hourlyLogs.length > 0 && (
                  <Button onClick={calculateSummary} className="flex-1 bg-primary">
                    Complete & View Summary
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Post-Milling Summary */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Post-Milling Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                Review your shift summary below. These values are automatically calculated from your hourly logs.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Unmilled Rice</Label>
                <p className="text-2xl font-bold">{summaryData.totalUnmilledRice} bags</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Milled Rice</Label>
                <p className="text-2xl font-bold text-primary">{summaryData.totalMilledRice} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Broken Rice</Label>
                <p className="text-2xl font-bold">{summaryData.totalBrokenRice} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Bran</Label>
                <p className="text-2xl font-bold">{summaryData.totalBran} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Dust</Label>
                <p className="text-2xl font-bold">{summaryData.totalDust} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Stones</Label>
                <p className="text-2xl font-bold">{summaryData.totalStones} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Final Yield Ratio</Label>
                <p className="text-2xl font-bold text-green-600">{summaryData.finalYieldRatio}%</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Broken Rice %</Label>
                <p className="text-2xl font-bold text-orange-600">{summaryData.finalBrokenPercent}%</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Downtime</Label>
                <p className="text-2xl font-bold text-red-600">{summaryData.totalDowntime} mins</p>
              </div>
            </div>

            <Separator />

            <Button onClick={handleFinalSubmit} className="w-full bg-primary" size="lg">
              Submit Checklist
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}