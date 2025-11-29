import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function BriquetteProductionChecklist({ taskId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [locationCompliant, setLocationCompliant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Step 1: Pre-Operation Checks
  const [preOpData, setPreOpData] = useState({
    machineClean: false,
    noNakedWires: false,
    properlyCalibrated: false,
    lastMaintenanceDate: '',
    workAreaClean: false,
    timestamp: null
  });

  // Step 2: Raw Material Checks
  const [rawMaterialData, setRawMaterialData] = useState({
    huskMoisture: '',
    huskConsistency: '',
    huskWeight: '',
    timestamp: null
  });

  // Step 3: Hourly Production Logs
  const [hourlyLogs, setHourlyLogs] = useState([]);

  // Step 4: Quality Control Logs (every 2 hours)
  const [qualityLogs, setQualityLogs] = useState([]);

  // Step 5: Safety Checks
  const [safetyData, setSafetyData] = useState({
    startShift: {
      fireproofGloves: false,
      goggles: false,
      mask: false,
      apron: false,
      safetyBoots: false,
      fireExtinguishers: false,
      emergencyExits: false
    },
    endShift: {
      fireproofGloves: false,
      goggles: false,
      mask: false,
      apron: false,
      safetyBoots: false,
      fireExtinguishers: false,
      emergencyExits: false
    }
  });

  // Step 6: Storage & Packaging
  const [storageData, setStorageData] = useState({
    storageDry: false,
    storageVentilated: false,
    storagePestFree: false,
    briquettesLabeled: false,
    briquettesSealed: false
  });

  // Summary
  const [summaryData, setSummaryData] = useState({
    totalOutput: 0,
    totalBags: 0,
    totalFuelUsed: 0,
    totalHuskUsed: 0,
    fuelEfficiency: 0,
    huskEfficiency: 0,
    variance: 0,
    avgAshContent: 0,
    avgCalorificValue: 0,
    totalDowntime: 0,
    downtimePercent: 0
  });

  // Geolocation tracking
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date()
          };
          setUserLocation(location);
          setLocationCompliant(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationCompliant(false);
        }
      );
    }
  }, []);

  const handlePreOpSubmit = () => {
    const allChecked = preOpData.machineClean && 
                       preOpData.noNakedWires && 
                       preOpData.properlyCalibrated && 
                       preOpData.workAreaClean &&
                       preOpData.lastMaintenanceDate;
    
    if (!allChecked) {
      alert('Please complete all pre-operation checks before proceeding');
      return;
    }

    setPreOpData({ ...preOpData, timestamp: new Date() });
    setCurrentStep(2);
  };

  const handleRawMaterialSubmit = () => {
    const moisture = parseFloat(rawMaterialData.huskMoisture);
    
    if (!rawMaterialData.huskMoisture || !rawMaterialData.huskConsistency || !rawMaterialData.huskWeight) {
      alert('Please complete all raw material checks');
      return;
    }

    // Validate moisture content (should be 10-15%)
    if (moisture < 10 || moisture > 15) {
      if (!window.confirm(`Warning: Husk moisture content is ${moisture}%. Recommended range is 10-15%. Continue anyway?`)) {
        return;
      }
    }

    setRawMaterialData({ ...rawMaterialData, timestamp: new Date() });
    setCurrentStep(3);
  };

  const addHourlyLog = () => {
    const newLog = {
      hour: hourlyLogs.length + 1,
      timestamp: new Date(),
      expectedOutput: '',
      actualOutput: '',
      bagsPackaged: '',
      staffOnDuty: '',
      rawHuskUsed: '',
      fuelConsumption: '',
      notes: '',
      downtime: '',
      huskEfficiency: 0,
      fuelEfficiency: 0,
      variance: 0
    };
    setHourlyLogs([...hourlyLogs, newLog]);
  };

  const updateHourlyLog = (index, field, value) => {
    const updatedLogs = [...hourlyLogs];
    updatedLogs[index][field] = value;

    const log = updatedLogs[index];
    
    // Auto-calculate efficiencies
    if (log.actualOutput && log.rawHuskUsed) {
      log.huskEfficiency = (parseFloat(log.actualOutput) / parseFloat(log.rawHuskUsed)).toFixed(2);
    }
    
    if (log.actualOutput && log.fuelConsumption) {
      log.fuelEfficiency = (parseFloat(log.actualOutput) / parseFloat(log.fuelConsumption)).toFixed(2);
    }

    if (log.actualOutput && log.expectedOutput) {
      log.variance = (parseFloat(log.actualOutput) - parseFloat(log.expectedOutput)).toFixed(2);
    }

    setHourlyLogs(updatedLogs);
  };

  const addQualityLog = () => {
    const newLog = {
      checkNumber: qualityLogs.length + 1,
      timestamp: new Date(),
      ashContent: '',
      calorificValue: '',
      densityCheck: '',
      shapeSize: '',
      supervisorApproved: false
    };
    setQualityLogs([...qualityLogs, newLog]);
  };

  const updateQualityLog = (index, field, value) => {
    const updatedLogs = [...qualityLogs];
    updatedLogs[index][field] = value;
    setQualityLogs(updatedLogs);
  };

  const calculateSummary = () => {
    const totals = hourlyLogs.reduce((acc, log) => ({
      totalOutput: acc.totalOutput + parseFloat(log.actualOutput || 0),
      totalBags: acc.totalBags + parseFloat(log.bagsPackaged || 0),
      totalFuelUsed: acc.totalFuelUsed + parseFloat(log.fuelConsumption || 0),
      totalHuskUsed: acc.totalHuskUsed + parseFloat(log.rawHuskUsed || 0),
      totalDowntime: acc.totalDowntime + parseFloat(log.downtime || 0)
    }), {
      totalOutput: 0,
      totalBags: 0,
      totalFuelUsed: 0,
      totalHuskUsed: 0,
      totalDowntime: 0
    });

    const fuelEfficiency = totals.totalFuelUsed > 0 
      ? (totals.totalOutput / totals.totalFuelUsed).toFixed(2) 
      : 0;
    
    const huskEfficiency = totals.totalHuskUsed > 0 
      ? (totals.totalOutput / totals.totalHuskUsed).toFixed(2) 
      : 0;

    const expectedTotal = hourlyLogs.reduce((sum, log) => sum + parseFloat(log.expectedOutput || 0), 0);
    const variance = (totals.totalOutput - expectedTotal).toFixed(2);

    const avgAshContent = qualityLogs.length > 0
      ? (qualityLogs.reduce((sum, log) => sum + parseFloat(log.ashContent || 0), 0) / qualityLogs.length).toFixed(2)
      : 0;

    const avgCalorificValue = qualityLogs.length > 0
      ? (qualityLogs.reduce((sum, log) => sum + parseFloat(log.calorificValue || 0), 0) / qualityLogs.length).toFixed(2)
      : 0;

    const totalMinutes = hourlyLogs.length * 60;
    const downtimePercent = totalMinutes > 0 
      ? ((totals.totalDowntime / totalMinutes) * 100).toFixed(2) 
      : 0;

    setSummaryData({
      ...totals,
      fuelEfficiency,
      huskEfficiency,
      variance,
      avgAshContent,
      avgCalorificValue,
      downtimePercent
    });

    setCurrentStep(4);
  };

  const handleFinalSubmit = async () => {
    const submissionData = {
      taskId,
      checklistType: 'briquette',
      preOperation: preOpData,
      rawMaterial: rawMaterialData,
      hourlyLogs,
      qualityLogs,
      safety: safetyData,
      storage: storageData,
      summary: summaryData,
      locationData: {
        compliant: locationCompliant,
        userLocation
      },
      submittedAt: new Date()
    };

    console.log('Briquette Submission Data:', submissionData);
    
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

      {/* Step 1: Pre-Operation Checks */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Pre-Operation Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Inspect the briquette machine before starting production
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="machineClean"
                  checked={preOpData.machineClean}
                  onCheckedChange={(checked) => setPreOpData({...preOpData, machineClean: checked})}
                />
                <Label htmlFor="machineClean">Machine is clean and dry</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="noNakedWires"
                  checked={preOpData.noNakedWires}
                  onCheckedChange={(checked) => setPreOpData({...preOpData, noNakedWires: checked})}
                />
                <Label htmlFor="noNakedWires">No naked electrical wires</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="properlyCalibrated"
                  checked={preOpData.properlyCalibrated}
                  onCheckedChange={(checked) => setPreOpData({...preOpData, properlyCalibrated: checked})}
                />
                <Label htmlFor="properlyCalibrated">Machine is properly calibrated</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastMaintenanceDate">Last Maintenance Date</Label>
                <Input
                  id="lastMaintenanceDate"
                  type="date"
                  value={preOpData.lastMaintenanceDate}
                  onChange={(e) => setPreOpData({...preOpData, lastMaintenanceDate: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="workAreaClean"
                  checked={preOpData.workAreaClean}
                  onCheckedChange={(checked) => setPreOpData({...preOpData, workAreaClean: checked})}
                />
                <Label htmlFor="workAreaClean">Work area is clean and hazard-free</Label>
              </div>
            </div>

            <Button onClick={handlePreOpSubmit} className="w-full bg-primary">
              Continue to Raw Material Checks
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Raw Material Checks */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Raw Material Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="huskMoisture">Husk Moisture Content (%) *</Label>
              <Input
                id="huskMoisture"
                type="number"
                step="0.1"
                placeholder="Recommended: 10-15%"
                value={rawMaterialData.huskMoisture}
                onChange={(e) => setRawMaterialData({...rawMaterialData, huskMoisture: e.target.value})}
              />
              {rawMaterialData.huskMoisture && (parseFloat(rawMaterialData.huskMoisture) < 10 || parseFloat(rawMaterialData.huskMoisture) > 15) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Moisture content outside recommended range (10-15%)
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="huskConsistency">Husk Consistency</Label>
              <select
                id="huskConsistency"
                className="w-full border rounded-md p-2"
                value={rawMaterialData.huskConsistency}
                onChange={(e) => setRawMaterialData({...rawMaterialData, huskConsistency: e.target.value})}
              >
                <option value="">Select consistency</option>
                <option value="uniform">Uniform</option>
                <option value="non-uniform">Non-uniform</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="huskWeight">Weigh Husk - 500kg Batches (kg)</Label>
              <Input
                id="huskWeight"
                type="number"
                placeholder="Enter weight in kg"
                value={rawMaterialData.huskWeight}
                onChange={(e) => setRawMaterialData({...rawMaterialData, huskWeight: e.target.value})}
              />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleRawMaterialSubmit} className="flex-1 bg-primary">
                Continue to Production
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Hourly Production Logs & Quality Control */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Step 3: Hourly Production Logs</span>
                <Badge>{hourlyLogs.length} hour(s) logged</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hourlyLogs.length === 0 ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    No hourly logs yet. Click "Add Hourly Log" to start recording production.
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
                            <Label className="text-xs">Expected Output (kg/hour)</Label>
                            <Input
                              type="number"
                              placeholder="Target"
                              value={log.expectedOutput}
                              onChange={(e) => updateHourlyLog(index, 'expectedOutput', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Actual Output (kg)</Label>
                            <Input
                              type="number"
                              placeholder="Actual"
                              value={log.actualOutput}
                              onChange={(e) => updateHourlyLog(index, 'actualOutput', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Bags Packaged</Label>
                            <Input
                              type="number"
                              placeholder="Bags"
                              value={log.bagsPackaged}
                              onChange={(e) => updateHourlyLog(index, 'bagsPackaged', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Staff on Duty</Label>
                            <Input
                              type="number"
                              placeholder="Count"
                              value={log.staffOnDuty}
                              onChange={(e) => updateHourlyLog(index, 'staffOnDuty', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Raw Husk Used (kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={log.rawHuskUsed}
                              onChange={(e) => updateHourlyLog(index, 'rawHuskUsed', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Fuel Consumption (liters)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="liters"
                              value={log.fuelConsumption}
                              onChange={(e) => updateHourlyLog(index, 'fuelConsumption', e.target.value)}
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

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                          <div className="text-sm">
                            <span className="font-medium">Husk Efficiency:</span> {log.huskEfficiency}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Fuel Efficiency:</span> {log.fuelEfficiency}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Variance:</span> {log.variance} kg
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            placeholder="Machine performance notes"
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

              <Button onClick={addHourlyLog} variant="outline" className="w-full">
                Add Hourly Log
              </Button>
            </CardContent>
          </Card>

          {/* Quality Control Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quality Control Checks (Every 2 Hours)</span>
                <Badge>{qualityLogs.length} check(s)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qualityLogs.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Add quality control checks performed every 2 hours
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {qualityLogs.map((log, index) => (
                    <Card key={index} className="border">
                      <CardContent className="pt-4 space-y-3">
                        <h4 className="font-medium">QC Check #{log.checkNumber}</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Ash Content (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="%"
                              value={log.ashContent}
                              onChange={(e) => updateQualityLog(index, 'ashContent', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Calorific Value (MJ/kg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="MJ/kg"
                              value={log.calorificValue}
                              onChange={(e) => updateQualityLog(index, 'calorificValue', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Density Check</Label>
                            <select
                              className="w-full border rounded-md p-2"
                              value={log.densityCheck}
                              onChange={(e) => updateQualityLog(index, 'densityCheck', e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="pass">Pass</option>
                              <option value="fail">Fail</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Shape & Size Inspection</Label>
                            <select
                              className="w-full border rounded-md p-2"
                              value={log.shapeSize}
                              onChange={(e) => updateQualityLog(index, 'shapeSize', e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="pass">Pass</option>
                              <option value="fail">Fail</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`qc-approved-${index}`}
                            checked={log.supervisorApproved}
                            onCheckedChange={(checked) => updateQualityLog(index, 'supervisorApproved', checked)}
                          />
                          <Label htmlFor={`qc-approved-${index}`}>Supervisor Sign-off</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              <Button onClick={addQualityLog} variant="outline" className="w-full">
                Add Quality Control Check
              </Button>
            </CardContent>
          </Card>

          {/* Safety Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Safety Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Start of Shift</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={safetyData.startShift.fireproofGloves}
                      onCheckedChange={(checked) => setSafetyData({
                        ...safetyData,
                        startShift: {...safetyData.startShift, fireproofGloves: checked}
                      })}
                    />
                    <Label>All workers wearing fireproof gloves</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={safetyData.startShift.goggles}
                      onCheckedChange={(checked) => setSafetyData({
                        ...safetyData,
                        startShift: {...safetyData.startShift, goggles: checked}
                      })}
                    />
                    <Label>Safety goggles worn</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={safetyData.startShift.mask}
                      onCheckedChange={(checked) => setSafetyData({
                        ...safetyData,
                        startShift: {...safetyData.startShift, mask: checked}
                      })}
                    />
                    <Label>Dust masks provided</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={safetyData.startShift.fireExtinguishers}
                      onCheckedChange={(checked) => setSafetyData({
                        ...safetyData,
                        startShift: {...safetyData.startShift, fireExtinguishers: checked}
                      })}
                    />
                    <Label>Fire extinguishers accessible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={safetyData.startShift.emergencyExits}
                      onCheckedChange={(checked) => setSafetyData({
                        ...safetyData,
                        startShift: {...safetyData.startShift, emergencyExits: checked}
                      })}
                    />
                    <Label>Emergency exits clear</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">End of Shift</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={safetyData.endShift.fireExtinguishers}
                      onCheckedChange={(checked) => setSafetyData({
                        ...safetyData,
                        endShift: {...safetyData.endShift, fireExtinguishers: checked}
                      })}
                    />
                    <Label>Fire extinguishers checked and accessible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={safetyData.endShift.emergencyExits}
                      onCheckedChange={(checked) => setSafetyData({
                        ...safetyData,
                        endShift: {...safetyData.endShift, emergencyExits: checked}
                      })}
                    />
                    <Label>Emergency exits remain clear</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage & Packaging */}
          <Card>
            <CardHeader>
              <CardTitle>Storage & Packaging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={storageData.storageDry}
                  onCheckedChange={(checked) => setStorageData({...storageData, storageDry: checked})}
                />
                <Label>Storage area is dry</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={storageData.storageVentilated}
                  onCheckedChange={(checked) => setStorageData({...storageData, storageVentilated: checked})}
                />
                <Label>Storage area is well-ventilated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={storageData.storagePestFree}
                  onCheckedChange={(checked) => setStorageData({...storageData, storagePestFree: checked})}
                />
                <Label>Storage area is pest-free</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={storageData.briquettesLabeled}
                  onCheckedChange={(checked) => setStorageData({...storageData, briquettesLabeled: checked})}
                />
                <Label>Briquettes properly labeled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={storageData.briquettesSealed}
                  onCheckedChange={(checked) => setStorageData({...storageData, briquettesSealed: checked})}
                />
                <Label>Briquettes sealed in packaging</Label>
              </div>
            </CardContent>
          </Card>

          {hourlyLogs.length > 0 && (
            <Button onClick={calculateSummary} className="w-full bg-primary">
              Complete & View Summary
            </Button>
          )}
        </div>
      )}

      {/* Step 4: Summary */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Shift Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                Review your shift summary. All values are automatically calculated from your logs.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Production Output</Label>
                <p className="text-2xl font-bold text-primary">{summaryData.totalOutput} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Bags Packaged</Label>
                <p className="text-2xl font-bold">{summaryData.totalBags}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Fuel Used</Label>
                <p className="text-2xl font-bold">{summaryData.totalFuelUsed} L</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Fuel Efficiency</Label>
                <p className="text-2xl font-bold text-green-600">{summaryData.fuelEfficiency} kg/L</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Husk Used</Label>
                <p className="text-2xl font-bold">{summaryData.totalHuskUsed} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Husk Efficiency</Label>
                <p className="text-2xl font-bold text-green-600">{summaryData.huskEfficiency}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Variance from Target</Label>
                <p className="text-2xl font-bold text-orange-600">{summaryData.variance} kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Avg Ash Content</Label>
                <p className="text-2xl font-bold">{summaryData.avgAshContent}%</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Avg Calorific Value</Label>
                <p className="text-2xl font-bold">{summaryData.avgCalorificValue} MJ/kg</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Downtime</Label>
                <p className="text-2xl font-bold text-red-600">{summaryData.totalDowntime} mins</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Downtime %</Label>
                <p className="text-2xl font-bold text-red-600">{summaryData.downtimePercent}%</p>
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