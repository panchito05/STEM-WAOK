// Para garantizar compatibilidad, simplemente importamos y exportamos componentes desde Exercise
import ExerciseComponent from './Exercise';
import { Settings as SettingsPanel } from './Exercise';

export const Exercise = ExerciseComponent;
export const Settings = SettingsPanel;

export default Exercise;