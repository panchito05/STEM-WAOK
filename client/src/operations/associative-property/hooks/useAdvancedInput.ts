import { useState, useCallback, useRef, useEffect } from 'react';

export interface InputFieldState {
  value: string;
  isActive: boolean;
  isValid: boolean;
}

export interface AdvancedInputManager {
  fields: { [key: string]: InputFieldState };
  activeField: string | null;
  setFieldValue: (fieldId: string, value: string) => void;
  setActiveField: (fieldId: string | null) => void;
  handleDigitInput: (digit: string) => void;
  handleBackspace: () => void;
  clearActiveField: () => void;
  validateField: (fieldId: string, expectedValue: string) => boolean;
  resetAllFields: () => void;
  isFieldDisabled: (fieldId: string) => boolean;
}

export const useAdvancedInput = (
  exerciseStarted: boolean,
  initialFields: string[] = ['blank1', 'blank2', 'blank3', 'blank4']
): AdvancedInputManager => {
  const [fields, setFields] = useState<{ [key: string]: InputFieldState }>(() => {
    const initialState: { [key: string]: InputFieldState } = {};
    initialFields.forEach(fieldId => {
      initialState[fieldId] = {
        value: '',
        isActive: false,
        isValid: false
      };
    });
    return initialState;
  });

  const [activeField, setActiveFieldInternal] = useState<string | null>(null);
  const activeFieldRef = useRef<string | null>(null);

  // Sync activeField with ref for event handlers
  useEffect(() => {
    activeFieldRef.current = activeField;
  }, [activeField]);

  const setFieldValue = useCallback((fieldId: string, value: string) => {
    if (!exerciseStarted) return;
    
    setFields(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value: value
      }
    }));
  }, [exerciseStarted]);

  const setActiveField = useCallback((fieldId: string | null) => {
    if (!exerciseStarted && fieldId !== null) return;
    
    setFields(prev => {
      const updated = { ...prev };
      // Deactivate all fields
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], isActive: false };
      });
      // Activate the selected field
      if (fieldId && updated[fieldId]) {
        updated[fieldId] = { ...updated[fieldId], isActive: true };
      }
      return updated;
    });
    
    setActiveFieldInternal(fieldId);
  }, [exerciseStarted]);

  const handleDigitInput = useCallback((digit: string) => {
    const currentField = activeFieldRef.current;
    if (!currentField || !exerciseStarted) return;
    
    setFields(prev => {
      const currentValue = prev[currentField]?.value || '';
      // Allow decimal point and numbers
      if (digit === '.' && currentValue.includes('.')) return prev;
      if (currentValue.length >= 10) return prev; // Prevent too long inputs
      
      return {
        ...prev,
        [currentField]: {
          ...prev[currentField],
          value: currentValue + digit
        }
      };
    });
  }, [exerciseStarted]);

  const handleBackspace = useCallback(() => {
    const currentField = activeFieldRef.current;
    if (!currentField || !exerciseStarted) return;
    
    setFields(prev => ({
      ...prev,
      [currentField]: {
        ...prev[currentField],
        value: prev[currentField].value.slice(0, -1)
      }
    }));
  }, [exerciseStarted]);

  const clearActiveField = useCallback(() => {
    const currentField = activeFieldRef.current;
    if (!currentField || !exerciseStarted) return;
    
    setFields(prev => ({
      ...prev,
      [currentField]: {
        ...prev[currentField],
        value: ''
      }
    }));
  }, [exerciseStarted]);

  const validateField = useCallback((fieldId: string, expectedValue: string): boolean => {
    const field = fields[fieldId];
    if (!field) return false;
    
    const isValid = parseFloat(field.value) === parseFloat(expectedValue);
    
    setFields(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        isValid
      }
    }));
    
    return isValid;
  }, [fields]);

  const resetAllFields = useCallback(() => {
    setFields(prev => {
      const reset: { [key: string]: InputFieldState } = {};
      Object.keys(prev).forEach(key => {
        reset[key] = {
          value: '',
          isActive: false,
          isValid: false
        };
      });
      return reset;
    });
    setActiveFieldInternal(null);
  }, []);

  const isFieldDisabled = useCallback((fieldId: string): boolean => {
    return !exerciseStarted;
  }, [exerciseStarted]);

  return {
    fields,
    activeField,
    setFieldValue,
    setActiveField,
    handleDigitInput,
    handleBackspace,
    clearActiveField,
    validateField,
    resetAllFields,
    isFieldDisabled
  };
};