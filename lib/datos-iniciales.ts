// Datos iniciales para cargar en Supabase
export const ACTIVIDADES = [
  { id: 'tirolesa',  nombre: 'Tirolesa',           color: '#F5C800', icono: '🪂', slug: 'tirolesa' },
  { id: 'arqueria',  nombre: 'Arquería',            color: '#1A7C5E', icono: '🏹', slug: 'arqueria' },
  { id: 'parque',    nombre: 'Parque Aéreo',        color: '#4FC3F7', icono: '🌲', slug: 'parque' },
  { id: 'salon',     nombre: 'Aventura Escondida',  color: '#FF7043', icono: '🎮', slug: 'salon' },
]

export const PLANILLAS_INICIALES = [
  // TIROLESA
  { codigo: 'MP00-001', nombre: 'Apertura de Parque', actividad_id: 'tirolesa', frecuencia: 'diaria',
    descripcion: 'Revisión diaria de senderos, limpieza general y control de matafuegos antes de abrir.',
    tareas: ['Verificar estado de senderos: compactación, piedras sueltas, escalones', 'Controlar crecimiento de arbustos en senderos', 'Poda selectiva en senderos', 'Limpieza general del parque incluyendo zona Arquería y Salón', 'Control de matafuegos (fecha de vencimiento de carga)'],
    materiales: ['Herramientas de poda', 'Elementos de limpieza'],
    instructivo: 'Recorrer todos los senderos controlando el estado del terreno. Señalar lugares con falta de compactación. Controlar y eliminar o calzar piedras sueltas. Verificar que los escalones estén firmes. Podar arbustos que entorpezcan el tránsito. Controlar fechas de vencimiento de matafuegos.' },

  { codigo: 'MP01-001', nombre: 'Bases de Anclaje y Cables', actividad_id: 'tirolesa', frecuencia: 'mensual',
    descripcion: 'Verificación mensual del estado de las bases de anclaje de los cables de tirolesa.',
    tareas: ['Verificación del estado del cable con la placa', 'Limpieza de canaletas', 'Control de estado de tornillos y bulones', 'Verificación de marcas de pintura en anclajes'],
    materiales: ['EPP: Casco, guantes, lentes, arnés, equipo de vuelo', 'Llave de tubo', 'Grasa'],
    instructivo: 'Usar EPP completo para desplazamiento de una base a otra. Verificar visualmente el estado de cada anclaje. Controlar que las marcas de pintura no hayan sido alteradas. Verificar ajuste de todos los elementos.' },

  { codigo: 'MP01-002', nombre: 'Freno Plataforma de Vuelo', actividad_id: 'tirolesa', frecuencia: 'bimestral',
    descripcion: 'Control bimestral del sistema de freno en plataformas de llegada.',
    tareas: ['Control de estado del freno principal', 'Verificación de amortiguadores', 'Control de anclajes del sistema de freno', 'Lubricación si corresponde'],
    materiales: ['EPP completo', 'Lubricante', 'Llave de tubo'],
    instructivo: 'Verificar el funcionamiento del freno de plataforma. Controlar el estado de todos los componentes del sistema. Lubricar partes móviles según necesidad.' },

  { codigo: 'MP01-003', nombre: 'Bases y Anclajes de Cables', actividad_id: 'tirolesa', frecuencia: 'semestral',
    descripcion: 'Revisión trimestral profunda de todas las bases y anclajes de los cables.',
    tareas: ['Inspección visual de todos los anclajes', 'Control de tornillos y bulones con torquímetro', 'Verificación de estado de macizos de hormigón', 'Control de corrosión en elementos metálicos'],
    materiales: ['EPP completo', 'Torquímetro', 'Antioxidante', 'Pintura protectora'],
    instructivo: 'Revisión completa de cada punto de anclaje. Verificar el torque de todos los elementos de fijación. Controlar el estado del hormigón en los macizos. Tratar la corrosión con antioxidante y pintura.' },

  { codigo: 'MP01-004', nombre: 'Equipos de Vuelo', actividad_id: 'tirolesa', frecuencia: 'semestral',
    descripcion: 'Control semestral completo de todos los equipos de vuelo: arneses, poleas, cintas y mosquetones.',
    tareas: ['Control de arneses: cintas, costuras, tomadores de carga', 'Control de poleas según ficha técnica del fabricante', 'Control de cintas express: estado de costuras', 'Control de cintas de seguridad: nudos y posición', 'Control de mosquetones de acero: desgaste y cierre', 'Completar planilla de control por equipo'],
    materiales: ['Fichas de revisión Petzl', 'Planilla de control'],
    instructivo: 'Verificar el estado de todos los equipos de vuelo uno por uno. Para arneses: controlar cintas, costuras y tomadores. Para poleas: seguir la ficha técnica Petzl. Registrar el estado de cada equipo en la planilla de control. Retirar de uso los equipos en mal estado.' },

  { codigo: 'MP01-005', nombre: 'Prueba de Carga Anual', actividad_id: 'tirolesa', frecuencia: 'anual',
    descripcion: 'Medición anual de la flecha de los cables y verificación del estado general.',
    tareas: ['Medición de la flecha del cable tramo 1', 'Medición de la flecha del cable tramo 2', 'Medición del punto central del cable con tachos de agua', 'Control de estado general de macizos', 'Estado de la placa de anclaje'],
    materiales: ['2 tachos de 200 litros', 'Cuerdas para colgar los tachos', '2 poleas de trabajo', 'Mangueras para llenado de tachos'],
    instructivo: 'Medir la flecha de las tirolesas colocando tachos con agua en el punto central. Verificar que el punto máximo de descenso esté dentro de los parámetros técnicos. Controlar el estado de macizos y placas.' },

  { codigo: 'MP01-006', nombre: 'Torque Prensacables', actividad_id: 'tirolesa', frecuencia: 'anual',
    descripcion: 'Revisión anual completa del sistema de anclaje de cables.',
    tareas: ['Verificación de prensacables', 'Control de tensores', 'Verificación de cables de traba de tensores', 'Inspección visual de marcas de pintura'],
    materiales: ['EPP completo', 'Llave de tubo', 'Torquímetro'],
    instructivo: 'Verificar que todos los prensacables estén correctamente apretados. Controlar tensores y sus trabas de cable de 6mm. Las trabas no deben ser removidas y deben estar instaladas en forma permanente. Verificar marcas de pintura.' },

  { codigo: 'MP20-007', nombre: 'Plataformas de Vuelo — Barandas y Piso', actividad_id: 'tirolesa', frecuencia: 'trimestral',
    descripcion: 'Control trimestral del estado estructural de la plataforma de vuelo.',
    tareas: ['Control de estructura de madera', 'Verificación de piso antideslizante', 'Control de barandas y pasamanos', 'Verificación de acceso y escalera'],
    materiales: ['Herramientas de carpintería', 'Tornillos', 'Sellador de madera'],
    instructivo: 'Verificar visualmente el estado de todos los elementos de la plataforma. Controlar la firmeza de barandas y pasamanos. Verificar el estado del piso antideslizante.' },

  { codigo: 'MP20-008', nombre: 'Barandas de Senderos — Control', actividad_id: 'tirolesa', frecuencia: 'trimestral',
    descripcion: 'Control mensual de barandas y elementos de seguridad en senderos.',
    tareas: ['Verificación de firmeza de barandas', 'Control de postes de sujeción', 'Estado de pintado y señalética'],
    materiales: ['Pintura', 'Herramientas de fijación'],
    instructivo: 'Recorrer todos los senderos controlando el estado de las barandas. Verificar la firmeza de cada poste. Controlar el estado de la señalética.' },

  { codigo: 'MP20-009', nombre: 'Plataformas de Vuelo — Ajuste', actividad_id: 'tirolesa', frecuencia: 'semestral',
    descripcion: 'Revisión trimestral de todas las plataformas del circuito.',
    tareas: ['Control estructural de maderas', 'Verificación de elementos de fijación', 'Estado de impermeabilización'],
    materiales: ['Sellador de madera', 'Tornillos', 'Herramientas'],
    instructivo: 'Inspección detallada de cada plataforma. Verificar el estado de las maderas, reemplazar las deterioradas.' },

  { codigo: 'MP20-010', nombre: 'Barandas de Senderos — Pintura', actividad_id: 'tirolesa', frecuencia: 'semestral',
    descripcion: 'Revisión trimestral de barandas secundarias.',
    tareas: ['Control de firmeza general', 'Verificación de elementos metálicos'],
    materiales: ['Antioxidante', 'Tornillos'],
    instructivo: 'Verificar el estado de barandas secundarias. Tratar la oxidación.' },

  { codigo: 'MP20-011', nombre: 'Plataformas de Vuelo — Pintura', actividad_id: 'tirolesa', frecuencia: 'semestral',
    descripcion: 'Revisión semestral profunda de las plataformas de vuelo.',
    tareas: ['Inspección estructural completa', 'Control de todos los elementos de fijación con torquímetro', 'Estado de maderas', 'Control de sistema de drenaje'],
    materiales: ['Torquímetro', 'Sellador', 'Madera de repuesto'],
    instructivo: 'Revisión exhaustiva semestral de las plataformas principales. Verificar torque de todos los bulones. Reemplazar maderas deterioradas.' },

  // ARQUERÍA
  { codigo: 'MP-02-001', nombre: 'Equipos de Uso', actividad_id: 'arqueria', frecuencia: 'semanal',
    descripcion: 'Revisión semanal de cuerdas, nocks, puntas, flechas y blancos.',
    tareas: ['Verificar estado de cuerdas de los arcos', 'Verificar estado de los nocks', 'Verificar estado de puntas de flechas', 'Controlar estado del astil de cada flecha', 'Controlar estado de los blancos'],
    materiales: ['Nocks', 'Pegamento para nocks', 'Hilo', 'Pegamento para puntas', 'Cuerdas', 'Blancos'],
    instructivo: 'Verificar el estado general de las cuerdas a simple vista. Controlar flecha por flecha que tengan los nocks bien colocados. Verificar que las puntas estén en posición correcta. Controlar que no hayan rajaduras en los astiles. Controlar estado de los blancos para su cambio.' },

  { codigo: 'MP-02-002', nombre: 'Seguridad Mensual', actividad_id: 'arqueria', frecuencia: 'mensual',
    descripcion: 'Revisión mensual de arcos, cuerdas, protectores y blancos.',
    tareas: ['Verificar el estado de los arcos (fibra de vidrio)', 'Verificar estado de las cuerdas', 'Controlar posición de la flecha en el arco', 'Controlar estado de protectores de mano y brazo', 'Verificar blancos de tiro y diplomas'],
    materiales: ['Hilo', 'Cuerdas', 'Empuñadura goma eva', 'Elásticos', 'Blancos', 'Diplomas'],
    instructivo: 'Controlar estado de los arcos recurvados. Verificar que el loop y el nocking point estén bien posicionados. Tomar arco por arco en tensión y revisar la cuerda. Verificar el estado de los elásticos de colocación. Controlar estado de los blancos.' },

  { codigo: 'MP-02-003', nombre: 'Infraestructura Semestral', actividad_id: 'arqueria', frecuencia: 'semestral',
    descripcion: 'Revisión semestral de pintura, protectores, contenciones y estructura general.',
    tareas: ['Verificar estado de pintura en postes y estructura', 'Verificar estado de protectores de brazo (cuero)', 'Verificar estado de protectores de dedos (tabs)', 'Verificar pintura de los arcos y su soporte', 'Verificar las contenciones', 'Control de poza de flechas y cajón de protectores'],
    materiales: ['Pintura', 'Thinner', 'Cuero', 'Pincel', 'Rodillo', 'Guantes', 'Lentes', 'Hilo'],
    instructivo: 'Revisar firmeza de la paja, troncos y techo de zona de tiro. Revisar estado de pintura de troncos, paneles y estructura. Verificar el estado del cuero y goma de los tabs. Limpiar protectores de brazo. Controlar estado de contención y su forrado.' },

  // AVENTURA ESCONDIDA
  { codigo: 'MP-03-001', nombre: 'Equipos de Uso', actividad_id: 'salon', frecuencia: 'semanal',
    descripcion: 'Revisión semanal de limpieza, redes, vidrios, toboganes y juegos.',
    tareas: ['Verificar estado general de limpieza de pisos, paredes y juegos', 'Verificar estado de sujeción de redes de contención', 'Verificar estado de limpieza de los vidrios', 'Verificar estado de las tablas del puente colgante', 'Controlar estado operativo de los juegos', 'Controlar limpieza del sector del fondo y la puerta'],
    materiales: ['Soplador', 'Blem', 'Plumero', 'Paño', 'Atornillador'],
    instructivo: 'Barrer, pasar trapo o soplar según necesidad. Tocar las redes para evaluar si están muy flojas y ajustar. Verificar el funcionamiento general de toboganes y trepadores. Controlar visualmente el estado de los vidrios. Detectar luces rotas e informar. Acomodar tablas del puente si hace falta.' },

  { codigo: 'MP-03-002', nombre: 'Seguridad Mensual', actividad_id: 'salon', frecuencia: 'mensual',
    descripcion: 'Revisión mensual de sujeción de estructuras, redes y palestra.',
    tareas: ['Revisar la sujeción de todas las estructuras', 'Revisar la tensión de las redes de seguridad', 'Controlar el ajuste de las tomas de la palestra'],
    materiales: [],
    instructivo: 'Controlar la tensión de redes y ajustar en caso de estar flojas. De manera manual controlar la firmeza de la estructura sacudiéndola. Verificar cada toma de la palestra.' },

  { codigo: 'MP-03-003', nombre: 'Infraestructura Semestral', actividad_id: 'salon', frecuencia: 'semestral',
    descripcion: 'Revisión semestral de pintura, pisos, estructuras y toboganes.',
    tareas: ['Verificar estado de pintura de las maderas', 'Verificar estado de pintura del piso y paredes', 'Verificar que no haya desplazamiento de estructuras', 'Verificar el ajuste del laberinto vertical', 'Verificar el ajuste de los toboganes'],
    materiales: ['Pintura', 'Thinner', 'Pincel o rodillo', 'Guantes', 'Lentes', 'Hilo'],
    instructivo: 'Controlar el estado de pintura de las maderas de toda la instalación. Controlar el estado de la pintura del piso de cemento. Controlar fijaciones de apoyo (al piso o techo) de toda la estructura. Ajustar toboganes y laberinto.' },

  // PARQUE AÉREO
  { codigo: 'MP-04-000', nombre: 'Bitácora Diaria Circuito Aéreo', actividad_id: 'parque', frecuencia: 'diaria',
    descripcion: 'Revisión visual diaria de los 19 puntos de control del circuito aéreo. OBLIGATORIA antes de abrir al público.',
    tareas: ['Punto 1 al 19: verificar marcas de pintura en anclajes', 'Verificar prensacables sin signos de manipulación', 'Verificar tensores con traba de cable de 6mm instalada', 'Verificar cables de traba de tensores instalados', 'Inspección visual general del circuito'],
    materiales: [],
    instructivo: 'Verificar en cada punto de control que las marcas de pintura no hayan sido violadas. Verificar cada prensacable y tensor que no muestren signos de manipulación o cables flojos. Si se detecta anomalía: registrar en bitácora, NO abrir al público, contactar al 11-3279-8939 (Tirolesas Argentina) con foto de la anomalía.' },

  { codigo: 'MP-04-001', nombre: 'Equipos de Vuelo Parque', actividad_id: 'parque', frecuencia: 'semestral',
    descripcion: 'Control semestral de arneses Pandion y poleas TRAC CLUB del Parque Aéreo.',
    tareas: ['Control de arneses Petzl Pandion: cintas, costuras, hebillas', 'Control de poleas Petzl TRAC CLUB: carcasa, vértigo, rulemanes', 'Completar planilla de control por equipo', 'Retirar de uso los equipos en mal estado'],
    materiales: ['Fichas de revisión Petzl Pandion', 'Fichas de revisión TRAC CLUB', 'Planilla de control semestral'],
    instructivo: 'Revisar cada arnés Pandion siguiendo la ficha técnica Petzl. Revisar cada polea TRAC CLUB. Registrar el estado en la planilla de control. Dar de baja los equipos que no cumplan los estándares.' },

  { codigo: 'MP-04-002', nombre: 'Revisión Empresa Externa', actividad_id: 'parque', frecuencia: 'semestral',
    descripcion: 'Revisión completa del circuito por Tirolesas Argentina. Coordinar con el proveedor.',
    tareas: ['Coordinar visita con Tirolesas Argentina (11-3279-8939)', 'Preparar acceso al circuito completo', 'Registrar fecha y resultados de la revisión', 'Implementar correcciones indicadas'],
    materiales: [],
    instructivo: 'Cada 6 meses la empresa Tirolesas Argentina realiza una revisión completa del circuito. Contactar al proveedor para coordinar la visita. Registrar los resultados y las acciones correctivas indicadas.' },

  { codigo: 'MP-04-003', nombre: 'Infraestructura Parque', actividad_id: 'parque', frecuencia: 'mensual',
    descripcion: 'Control mensual de la estructura general del parque aéreo.',
    tareas: ['Control de postes y estructura de madera', 'Verificación de tensores y cables de nivel 1 (3m)', 'Verificación de tensores y cables de nivel 2 (6m)', 'Control de 9 puentes nivel 1', 'Control de 9 puentes nivel 2', 'Control de mini tirolesa final'],
    materiales: ['EPP completo', 'Llave de tubo'],
    instructivo: 'Recorrer el circuito completo verificando el estado de la estructura. Controlar la tensión de cables en ambos niveles. Verificar cada puente e identificar elementos deteriorados.' },
]

export const PUNTOS_CONTROL_PARQUE = Array.from({ length: 19 }, (_, i) => ({
  numero: i + 1,
  descripcion: i < 18
    ? `Punto de control ${i + 1}: verificar anclaje, marcas de pintura, prensacable y tensor`
    : 'Inspección visual general del circuito completo',
}))
