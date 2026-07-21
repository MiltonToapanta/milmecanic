import type { EditableDiagnosticItem } from '../types/service-diagnostic.types';

type PresetItem = Omit<EditableDiagnosticItem, 'localId'>;

export const completeDiagnosticPreset: PresetItem[] = [
  { category: 'ENGINE', itemName: 'Aceite de motor', status: 'GOOD', observation: 'Nivel y condición dentro de rango.' },
  { category: 'ENGINE', itemName: 'Filtros de motor', status: 'REGULAR', observation: 'Revisar cambio según kilometraje.' },
  { category: 'BRAKES', itemName: 'Pastillas delanteras', status: 'REGULAR', observation: 'Revisar espesor y desgaste.' },
  { category: 'BRAKES', itemName: 'Discos de freno', status: 'GOOD', observation: 'Sin deformación visible.' },
  { category: 'SUSPENSION', itemName: 'Amortiguadores', status: 'REGULAR', observation: 'Verificar fuga o pérdida de presión.' },
  { category: 'STEERING', itemName: 'Terminales de dirección', status: 'GOOD', observation: 'Sin juego excesivo.' },
  { category: 'TRANSMISSION', itemName: 'Caja de cambios', status: 'GOOD', observation: 'Funcionamiento normal en prueba básica.' },
  { category: 'ELECTRICAL', itemName: 'Alternador', status: 'GOOD', observation: 'Carga inicial correcta.' },
  { category: 'BATTERY', itemName: 'Batería', status: 'REGULAR', observation: 'Revisar bornes y capacidad de arranque.' },
  { category: 'TIRES', itemName: 'Neumáticos delanteros', status: 'REGULAR', observation: 'Revisar presión y desgaste irregular.' },
  { category: 'COOLING', itemName: 'Sistema de refrigeración', status: 'GOOD', observation: 'Nivel y temperatura sin novedad inicial.' },
  { category: 'LIGHTS', itemName: 'Luces exteriores', status: 'GOOD', observation: 'Luces principales operativas.' },
  { category: 'FLUIDS', itemName: 'Fluido de frenos', status: 'REGULAR', observation: 'Revisar nivel y condición.' },
  { category: 'BODY', itemName: 'Carrocería general', status: 'NOT_CHECKED', observation: 'Pendiente inspección visual detallada.' }
];

export const safetyDiagnosticPreset: PresetItem[] = [
  { category: 'BRAKES', itemName: 'Pastillas delanteras', status: 'REGULAR', observation: 'Revisar desgaste antes de aprobar salida.' },
  { category: 'BRAKES', itemName: 'Freno de mano', status: 'GOOD', observation: 'Accionamiento normal.' },
  { category: 'TIRES', itemName: 'Estado de neumáticos', status: 'REGULAR', observation: 'Revisar presión, labrado y desgaste irregular.' },
  { category: 'LIGHTS', itemName: 'Luces de freno y direccionales', status: 'GOOD', observation: 'Operativas en inspección básica.' },
  { category: 'STEERING', itemName: 'Juego de dirección', status: 'GOOD', observation: 'Sin juego excesivo detectado.' },
  { category: 'SUSPENSION', itemName: 'Rótulas y bujes', status: 'REGULAR', observation: 'Revisar ruido o desgaste en prueba de ruta.' }
];

export function materializePreset(items: PresetItem[]): EditableDiagnosticItem[] {
  return items.map((item) => ({ ...item, localId: crypto.randomUUID() }));
}
