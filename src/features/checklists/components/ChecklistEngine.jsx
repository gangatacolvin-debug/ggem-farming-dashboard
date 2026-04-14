import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertCircle,
  MapPin,
  AlertTriangle,
  Lock,
  Save,
  ChevronRight,
  Clock
} from 'lucide-react';

import TextField from './fields/TextField';
import NumberField from './fields/NumberField';
import CheckboxField from './fields/CheckboxField';
import LogTableField from './fields/LogTableField';
import SummaryField from './fields/SummaryField';
import DateField from './fields/DateField';
import SelectField from './fields/SelectField';
import TimeField from './fields/TimeField';
import TextareaField from './fields/TextareaField';
import FirestoreSelectField from './fields/Firestoreselectfield';
import FirestoreMultiselectField from './fields/Firestoremultiselectfield';
import FirestoreMultiselectWithManualField from './fields/Firestoremultiselectwithmanualfield';
import FarmerLookupField from './fields/FarmerLookupField';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GGEM_LOCATIONS } from '@/lib/locations';
import { useAuth } from '@/context/AuthContext';
import {
  AGGREGATION_NON_ADMIN_CHECKLIST_IDS,
  fetchActiveAggregationSessionForUser,
  fetchActiveAggregationSessionAtHub,
  formatAggregationHubDisplay,
} from '@/features/aggregation/lib/aggregationSessions';

/**
 * Calculates distance in meters between two coordinates
 */
const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const MAX_ALLOWED_DISTANCE = 4336539; // meters

/**
 * Renders the appropriate field component based on type.
 */
const FieldRenderer = ({ field, checklistType }) => {
  switch (field.type) {
    case 'text':
      return <TextField field={field} />;
    case 'textarea':
      return <TextareaField field={field} />;
    case 'number':
      return <NumberField field={field} />;
    case 'checkbox':
      return <CheckboxField field={field} />;
    case 'select':
      return <SelectField field={field} />;
    case 'log-table':
      return <LogTableField field={field} />;
    case 'summary':
      return <SummaryField field={field} checklistType={checklistType} />;
    case 'date':
      return <DateField field={field} />;
    case 'time':
      return <TimeField field={field} />;
    case 'firestore-select':
      return <FirestoreSelectField field={field} />;
    case 'firestore-multiselect':
      return <FirestoreMultiselectField field={field} />;
    case 'firestore-multiselect-with-manual':
      return <FirestoreMultiselectWithManualField field={field} />;
    case 'farmer-lookup':
      return <FarmerLookupField field={field} />;
    case 'info':
      return (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {field.label && <strong className="block mb-1">{field.label}</strong>}
            {field.content}
          </AlertDescription>
        </Alert>
      );
    default:
      return (
        <div className="p-2 border border-red-200 bg-red-50 text-red-700 rounded">
          Unknown field type: {field.type}
        </div>
      );
  }
};

/**
 * ChecklistEngine with section-based progress, auto-save and location verification
 */
export default function ChecklistEngine({
  config,
  initialData = {},
  onSubmit,
  taskId,
  taskData
}) {
  const [activeSection, setActiveSection] = useState(config.sections[0]?.id);
  const [completedSections, setCompletedSections] = useState([]);
  const [locationStatus, setLocationStatus] = useState('locating');
  const [distance, setDistance] = useState(null);
  const [expectedLocation, setExpectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [sectionLocationStatus, setSectionLocationStatus] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  // Early Exit State
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [exitLoading, setExitLoading] = useState(false);

  // Handoff State
  const [showHandoffDialog, setShowHandoffDialog] = useState(false);
  const [handoffReason, setHandoffReason] = useState('');
  const [handoffLoading, setHandoffLoading] = useState(false);
  /** Step 4: active session already open at selected hub (pre-aggregation only). */
  const [preAggHubClash, setPreAggHubClash] = useState(null);

  const { currentUser } = useAuth();

  // Ref map to track each section's DOM element for auto-scroll
  const sectionRefs = useRef({});

  const formMethods = useForm({
    defaultValues: initialData,
    mode: 'onChange'
  });

  const { handleSubmit, formState: { isValid }, setValue, watch, getValues } = formMethods;
  const watchedPreAggHub = watch('hub');

  // Auto-calculation for Weighing Checklist (Cross-section)
  const weighingLogs = watch('farmer-weighing-logs');
  useEffect(() => {
    if (config.id === 'aggregation-weighing-recording' && Array.isArray(weighingLogs)) {
      const farmers = weighingLogs.length;
      const weight = weighingLogs.reduce((sum, row) => sum + (parseFloat(row.weightKg) || 0), 0);
      const gross = weighingLogs.reduce((sum, row) => sum + (parseFloat(row.grossAmount) || 0), 0);
      
      setValue('total-farmers-weighed', farmers, { shouldValidate: true });
      setValue('total-weight-kg', weight, { shouldValidate: true });
      setValue('total-gross-amount', gross, { shouldValidate: true });
    }
  }, [weighingLogs, config.id, setValue]);

  // Auto-populate Fields Logic
  useEffect(() => {
    if (!taskData) return;

    config.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.autoPopulate) {
          const currentValue = getValues(field.id);
          // Only populate if empty to avoid overwriting user edits (unless it's a live timestamp)
          if (!currentValue) {
            let valueToSet = '';

            // Handle session inheritance (Step 3/7)
            if (field.autoPopulateFromSession) {
              const sessionId = getValues('session-id-ref') || getValues('session-id');
              if (sessionId) {
                // We'll use a cached session lookup or wait for the useEffect below
                // For now, let's let the session-specific effect handle this
              }
            }

            switch (field.autoPopulate) {
              case 'date':
                valueToSet = new Date().toLocaleDateString();
                break;
              case 'shift':
                valueToSet = taskData.shift || 'Day';
                break;
              case 'supervisorName':
                // Attempt to use the name passed in supervisorInfo, or just ID if not available
                valueToSet = taskData.supervisorInfo?.name || taskData.assignedTo || 'Unassigned';
                break;
              case 'timestamp':
                // For timestamps, we might want to set this when the section becomes active or on render
                valueToSet = new Date().toLocaleString();
                break;
              default:
                break;
            }

            if (valueToSet) {
              console.log(`Auto-populating ${field.id} with ${valueToSet}`);
              setValue(field.id, valueToSet, { shouldValidate: true, shouldDirty: true });
            }
          }
        }
      });
    });
  }, [taskData, config, setValue, getValues, activeSection]); // Re-run when section changes to update timestamps

  // Step 3: pre-fill session-id-ref + hub from aggregationSessions for non-admin aggregation checklists
  useEffect(() => {
    if (!currentUser?.uid || !AGGREGATION_NON_ADMIN_CHECKLIST_IDS.has(config.id)) return;

    let cancelled = false;

    (async () => {
      try {
        const session = await fetchActiveAggregationSessionForUser(currentUser.uid);
        if (cancelled || !session) return;

        const currentRef = getValues('session-id-ref');
        const currentHub = getValues('hub');

        if (!currentRef && session.sessionId) {
          setValue('session-id-ref', session.sessionId, { shouldValidate: true, shouldDirty: true });
        }

        if (!currentHub && session.hub) {
          setValue('hub', formatAggregationHubDisplay(session.hub), {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        // AUTO-INHERIT SESSION DATA (Burden 3)
        // If the session has expectedFarmers, populate it
        const sessionRef = doc(db, 'aggregationSessions', session.firestoreDocId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
          const sData = sessionSnap.data();
          config.sections.forEach(sec => {
            sec.fields.forEach(f => {
              if (f.autoPopulateFromSession && sData[f.autoPopulateFromSession]) {
                const curVal = getValues(f.id);
                if (!curVal) {
                  setValue(f.id, sData[f.autoPopulateFromSession], { shouldValidate: true });
                }
              }
            });
          });
        }
      } catch (e) {
        console.warn('Aggregation session auto-fill failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config.id, currentUser?.uid, setValue, getValues]);

  // Pre-aggregation: generate read-only Session ID once per open
  useEffect(() => {
    if (config.id !== 'pre-aggregation-setup') return;
    const sid = getValues('session-id');
    if (sid) return;

    // Generate ID including date: AGG-YYYYMMDD-6CHAR
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomUUID().replace(/-/g, '').slice(0, 7).toUpperCase();
    const generated = `AGG-${dateStr}-${random}`;
    
    setValue('session-id', generated, { shouldValidate: true, shouldDirty: true });
  }, [config.id, taskId, setValue, getValues]);


  // Step 4: hub clash — block submit if another active session exists at this hub
  useEffect(() => {
    if (config.id !== 'pre-aggregation-setup') {
      setPreAggHubClash(null);
      return;
    }
    if (!watchedPreAggHub) {
      setPreAggHubClash(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const clash = await fetchActiveAggregationSessionAtHub(watchedPreAggHub);
        if (cancelled) return;
        setPreAggHubClash(clash);
      } catch (e) {
        console.warn('Hub clash check failed:', e);
        if (!cancelled) setPreAggHubClash(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config.id, watchedPreAggHub]);

  // Watch for destination hub changes (for hub collection checklist)
  const destinationHub = watch('destination-hub') || watch('destinationHub');

  // Determine expected location based on checklist type and current section
  useEffect(() => {
    let location = null;
    const currentSectionConfig = config.sections.find(s => s.id === activeSection);
    console.log('🔍 DEBUG - Active Section:', activeSection); // ← ADD THIS
    console.log('🔍 DEBUG - Section Config:', currentSectionConfig); // ← ADD THIS

    // Check if current section requires location verification
    if (currentSectionConfig?.requiresLocation && config.locationCheckpoints) {
      const checkpointKey = config.locationCheckpoints[activeSection];

      console.log('🔍 DEBUG - Checkpoint Key:', checkpointKey); // ← ADD THIS
      console.log('🔍 DEBUG - Destination Hub Field:', destinationHub); // ← ADD THIS

      if (checkpointKey === 'originHub' && destinationHub) {
        // For hub-based sections, use the selected hub
        location = GGEM_LOCATIONS[destinationHub];
        console.log('🔍 DEBUG - Using Dynamic Hub:', destinationHub, location);
      } else if (checkpointKey) {
        // For other checkpoints, lookup directly
        location = GGEM_LOCATIONS[checkpointKey];
        console.log('🔍 DEBUG - Using Static Location:', checkpointKey, location);
      }
    } else {
      // Legacy: Fallback to checklist-level location
      switch (config.id) {
        case 'briquette-production':
        case 'milling-process':
        case 'warehouse-maintenance':
          location = GGEM_LOCATIONS['main-warehouse'];
          break;

        case 'hub-transfer-inspection':
          if (destinationHub) {
            location = GGEM_LOCATIONS[destinationHub];
          }
          break;

        default:
          location = null;
      }
    }

    setExpectedLocation(location);
  }, [config.id, config.locationCheckpoints, activeSection, destinationHub]);

  // GPS tracking & Auto-save
  useEffect(() => {
    if (!taskId) return;

    let locationWatchId;

    if (navigator.geolocation) {
      locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          console.log('📍 GPS - Current Position:', latitude, longitude, 'Accuracy:', accuracy);
          setCurrentLocation({ latitude, longitude, accuracy });

          let dist = null;
          let isCompliant = true;

          if (expectedLocation?.latitude && expectedLocation?.longitude) {
            dist = getDistanceFromLatLonInM(
              latitude,
              longitude,
              expectedLocation.latitude,
              expectedLocation.longitude
            );
            const maxDist = expectedLocation.radius || 500;
            setDistance(Math.round(dist));
            isCompliant = dist <= maxDist;
            setLocationStatus(isCompliant ? 'compliant' : 'warning');
          } else {
            setLocationStatus('no-requirement');
          }

          setValue('_location', {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString(),
            compliant: isCompliant,
            distance: dist,
            expectedLocation: expectedLocation?.name || 'No requirement',
            currentSection: activeSection
          });
        },
        (error) => {
          console.error('Location error:', error);
          setLocationStatus('error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    // Auto-save with debounce
    const subscription = formMethods.watch((value) => {
      const saveData = async () => {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');

          await setDoc(doc(db, 'tasks', taskId), {
            checklistProgress: value,
            currentSection: activeSection,
            completedSections: completedSections,
            lastUpdated: new Date()
          }, { merge: true });

          setLastSaved(new Date());
        } catch (err) {
          console.error("Auto-save failed", err);
        }
      };

      // Debounce auto-save
      const timer = setTimeout(saveData, 2000);
      return () => clearTimeout(timer);
    });

    return () => {
      subscription.unsubscribe();
      if (locationWatchId) navigator.geolocation.clearWatch(locationWatchId);
    };
  }, [taskId, expectedLocation, setValue, activeSection, completedSections, formMethods]);

  // Calculate section completion
  const getSectionCompletion = (section) => {
    const values = getValues();
    const requiredFields = section.fields.filter(f => f.required);

    if (requiredFields.length === 0) return 100;

    const completed = requiredFields.filter(f => {
      const value = values[f.id];
      const isComplete = value !== undefined && value !== null && value !== '';
      if (!isComplete) {
        console.log(`❌ Field Incomplete: ${f.id} in section ${section.id}`, { value });
      }
      return isComplete;
    }).length;

    return Math.round((completed / requiredFields.length) * 100);
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const totalSections = config.sections.length;
    const completedCount = completedSections.length;
    return Math.round((completedCount / totalSections) * 100);
  };

  // Check if section can be accessed
  const canAccessSection = (sectionId) => {
    const section = config.sections.find(s => s.id === sectionId);
    if (!section) return false;

    // First section is always accessible
    const sectionIndex = config.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === 0) return true;

    // Check if previous section is completed
    const previousSection = config.sections[sectionIndex - 1];
    return completedSections.includes(previousSection.id);
  };

  // Check if current section requires location and if location is verified
  const checkSectionLocationRequirement = () => {
    const currentSectionConfig = config.sections.find(s => s.id === activeSection);

    if (!currentSectionConfig?.requiresLocation) {
      return { required: false, verified: true };
    }

    const isVerified = locationStatus === 'compliant';

    return {
      required: true,
      verified: isVerified,
      message: currentSectionConfig.locationMessage || 'Location verification required for this section'
    };
  };

  // Mark section as complete and move to next
  const handleSectionComplete = () => {
    const locationCheck = checkSectionLocationRequirement();

    if (locationCheck.required && !locationCheck.verified) {
      toast.error('Location Required', {
        description: locationCheck.message,
        duration: 5000,
      });
      return;
    }

    const completion = getSectionCompletion(config.sections.find(s => s.id === activeSection));

    if (completion < 100) {
      toast.warning('Section Incomplete', {
        description: 'Some required fields are missing. Marking as complete anyway.',
        duration: 4000,
      });
    }

    if (!completedSections.includes(activeSection)) {
      setCompletedSections([...completedSections, activeSection]);
    }

    // Move to next section + smooth scroll
    const currentIndex = config.sections.findIndex(s => s.id === activeSection);
    if (currentIndex < config.sections.length - 1) {
      const nextSection = config.sections[currentIndex + 1];
      setActiveSection(nextSection.id);
      toast.success('Section Complete ✓', { duration: 2000 });

      // Scroll to the next section after React re-renders it open
      setTimeout(() => {
        const el = sectionRefs.current[nextSection.id];
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 88; // offset for sticky header
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 150);
    } else {
      toast.success('All sections done! Ready to submit.', { duration: 3000 });
    }
  };

  const onFormSubmit = (data) => {
    if (config.id === 'pre-aggregation-setup' && preAggHubClash) {
      toast.error('Session Already Active', {
        description: 'An active aggregation session already exists at this hub. Choose another hub or close the existing session first.',
        duration: 6000,
      });
      return;
    }

    // Check if all sections are completed
    const allCompleted = config.sections.every(s => completedSections.includes(s.id));

    if (!allCompleted) {
      toast.warning('Incomplete Sections', {
        description: 'Submitting with incomplete sections. This will be flagged for review.',
        duration: 4000,
      });
    }

    if (onSubmit) {
      onSubmit({
        ...data,
        completedAt: new Date(),
        checklistType: config.id,
        completedSections: completedSections,
        finalSection: activeSection
      });
    }

    // CLOSE SESSION TRIGGER (Pillar 4)
    if (config.closeSessionOnSubmit) {
      const sessionIdRef = data['session-id-ref'] || data['session-id'];
      if (sessionIdRef) {
        (async () => {
          try {
            const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
            const q = query(collection(db, 'aggregationSessions'), where('sessionId', '==', sessionIdRef));
            const snap = await getDocs(q);
            if (!snap.empty) {
              await updateDoc(snap.docs[0].ref, {
                status: 'closed',
                closedAt: new Date(),
                closedBy: currentUser.uid
              });
              toast.success('Session Closed', {
                description: `Session ${sessionIdRef} has been successfully closed.`,
                duration: 5000,
              });
            }
          } catch (err) {
            console.error('Failed to close session:', err);
            toast.error('Close Failed', { description: 'Could not close the session. Please try again.' });
          }
        })();
      }
    }
  };

  const handleEndEarly = async () => {
    if (!exitReason.trim()) {
      toast.warning('Reason Required', { description: 'Please provide a reason before ending early.' });
      return;
    }

    setExitLoading(true);

    const currentData = formMethods.getValues();

    if (onSubmit) {
      await onSubmit({
        ...currentData,
        shiftInfo: {
          ...currentData.shiftInfo,
          endedEarly: true,
          endReason: exitReason,
          endedAt: new Date()
        },
        status: 'ended-early',
        checklistType: config.id,
        completedSections: completedSections,
        currentSection: activeSection
      });
    }

    toast.info('Checklist Ended Early', { description: `Reason: ${exitReason}`, duration: 4000 });
    setExitLoading(false);
    setShowExitDialog(false);
  };

  const handleHandoff = async () => {
    if (!handoffReason.trim()) {
      toast.warning('Reason Required', { description: 'Please provide a reason for the handoff.' });
      return;
    }

    setHandoffLoading(true);

    const currentData = formMethods.getValues();

    // Save current progress for handoff
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'handoff-pending',
        handoffReason: handoffReason,
        handoffRequestedAt: new Date(),
        handoffRequestedBy: taskData?.assignedTo,
        checklistProgress: currentData,
        completedSections: completedSections,
        currentSection: activeSection
      });

      toast.success('Handoff Requested ✓', {
        description: 'Your manager has been notified and will reassign this task.',
        duration: 5000,
      });
      setShowHandoffDialog(false);
    } catch (error) {
      console.error('Handoff error:', error);
      toast.error('Handoff Failed', { description: 'Could not request handoff. Please try again.' });
    } finally {
      setHandoffLoading(false);
    }
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 overscroll-contain">

        {/* Header with Progress */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="p-3 lg:p-6">
            <div className="flex items-start justify-between mb-3 lg:mb-4 gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 leading-tight">{config.title}</h1>
                {config.description && (
                  <p className="text-xs lg:text-sm text-gray-600 mt-0.5 lg:mt-1 hidden sm:block">{config.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                {/* Mobile: icon buttons only */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 px-2 lg:px-3"
                  onClick={() => setShowHandoffDialog(true)}
                  title="Request Handoff"
                >
                  <span className="hidden sm:inline">Request Handoff</span>
                  <span className="sm:hidden text-xs">Handoff</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 px-2 lg:px-3"
                  onClick={() => setShowExitDialog(true)}
                  title="End Early"
                >
                  <span className="hidden sm:inline">End Early</span>
                  <span className="sm:hidden text-xs">Exit</span>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isValid || !!preAggHubClash}
                  className="bg-green-600 hover:bg-green-700 px-2 lg:px-4"
                >
                  <CheckCircle2 className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Complete &amp; Submit</span>
                  <span className="lg:hidden text-xs ml-1">Submit</span>
                </Button>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Overall Progress</span>
                <span>{completedSections.length} of {config.sections.length} sections completed</span>
              </div>
              <Progress value={getOverallProgress()} className="h-3" />
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                <Save className="w-3 h-3" />
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}

            {config.id === 'pre-aggregation-setup' && preAggHubClash && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  An active aggregation session is already open at this hub (session ID:{' '}
                  <strong>{preAggHubClash.sessionId}</strong>). You cannot start another session here until
                  that session is closed. Select a different hub or ask a manager to close the existing
                  session.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Location Banner */}
          <div className="px-6 pb-4">
            {locationStatus === 'locating' && (
              <Alert className="bg-blue-50 border-blue-200">
                <MapPin className="w-4 h-4 text-blue-600 animate-pulse" />
                <AlertDescription className="text-blue-700">
                  Acquiring location...
                  {expectedLocation && ` (Target: ${expectedLocation.name})`}
                </AlertDescription>
              </Alert>
            )}

            {locationStatus === 'compliant' && distance !== null && expectedLocation && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  ✓ Location Verified: {distance}m from {expectedLocation.name}
                </AlertDescription>
              </Alert>
            )}

            {locationStatus === 'warning' && distance !== null && expectedLocation && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  ⚠ Warning: You are {distance}m away from {expectedLocation.name}
                  {config.sections.find(s => s.id === activeSection)?.requiresLocation &&
                    ` - You must be within ${expectedLocation.radius || 500}m to complete this section`}
                </AlertDescription>
              </Alert>
            )}

            {locationStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>Location unavailable. Please enable GPS.</AlertDescription>
              </Alert>
            )}

            {locationStatus === 'no-requirement' && (
              <Alert className="bg-gray-50 border-gray-200">
                <MapPin className="w-4 h-4 text-gray-600" />
                <AlertDescription className="text-gray-700">
                  No location verification required for current section
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Section Navigation - Accordion Style */}
        <div className="max-w-7xl mx-auto px-3 lg:px-6">
          <Accordion
            type="single"
            collapsible
            value={activeSection}
            onValueChange={setActiveSection}
            className="space-y-4"
          >
            {config.sections.map((section, index) => {
              const isCompleted = completedSections.includes(section.id);
              const isAccessible = canAccessSection(section.id);
              const isActive = activeSection === section.id;
              const completion = getSectionCompletion(section);
              const locationCheck = section.requiresLocation ?
                checkSectionLocationRequirement() : { required: false, verified: true };

              return (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  disabled={!isAccessible}
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  className={`border-2 rounded-lg overflow-hidden transition-all ${isCompleted ? 'border-green-500 bg-green-50/30' :
                    isActive ? 'border-blue-500 bg-blue-50/30' :
                      isAccessible ? 'border-gray-200' :
                        'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        {/* Section Icon/Number */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${isCompleted ? 'bg-green-500 text-white' :
                          isActive ? 'bg-blue-500 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            section.icon || (index + 1)
                          )}
                        </div>

                        {/* Section Info */}
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{section.title}</h3>
                          {section.description && (
                            <p className="text-sm text-gray-600">{section.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {section.estimatedDuration && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ~{section.estimatedDuration} mins
                              </span>
                            )}
                            {section.requiresLocation && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                Location Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 mr-4">
                        {!isAccessible && (
                          <Badge variant="secondary" className="bg-gray-200">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-green-500">
                            Completed
                          </Badge>
                        )}
                        {!isCompleted && isAccessible && (
                          <div className="flex items-center gap-2">
                            <Progress value={completion} className="w-24 h-2" />
                            <span className="text-sm font-medium text-gray-600">
                              {completion}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6">
                    {/* Location Warning for this section */}
                    {section.requiresLocation && !locationCheck.verified && (
                      <Alert className="bg-orange-50 border-orange-200 mb-4">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <strong>Location Required:</strong> {locationCheck.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Fields */}
                    <div className="space-y-4">
                      {section.fields.map((field) => (
                        <div
                          key={field.id}
                          className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
                        >
                          <FieldRenderer field={field} checklistType={config.id} />
                        </div>
                      ))}
                    </div>

                    {/* Section Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        {section.fields.filter(f => f.required).length} required fields
                      </div>

                      {!isCompleted && (
                        <Button
                          type="button"
                          onClick={handleSectionComplete}
                          disabled={section.requiresLocation && !locationCheck.verified}
                        >
                          Mark Section Complete
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}

                      {isCompleted && (
                        <Badge className="bg-green-500 px-4 py-2">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Section Completed
                        </Badge>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Early Exit Dialog */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Task Early?</DialogTitle>
              <DialogDescription>
                This will save your progress and mark the task as incomplete.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Reason for ending early</Label>
              <Textarea
                placeholder="e.g., Emergency, Equipment failure, Health issue..."
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExitDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndEarly}
                disabled={!exitReason.trim() || exitLoading}
              >
                {exitLoading ? 'Ending...' : 'Confirm End Early'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Handoff Dialog */}
        <Dialog open={showHandoffDialog} onOpenChange={setShowHandoffDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Task Handoff</DialogTitle>
              <DialogDescription>
                Request to transfer this task to another supervisor. Your progress will be saved.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Reason for handoff</Label>
              <Textarea
                placeholder="e.g., Shift change, Emergency, Unable to continue..."
                value={handoffReason}
                onChange={(e) => setHandoffReason(e.target.value)}
                className="mt-2"
              />

              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Manager will be notified and can reassign this task to another supervisor.
                  Current progress: {completedSections.length}/{config.sections.length} sections completed.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHandoffDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleHandoff}
                disabled={!handoffReason.trim() || handoffLoading}
              >
                {handoffLoading ? 'Requesting...' : 'Request Handoff'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </FormProvider>
  );
}