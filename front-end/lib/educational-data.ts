import type { MuscleInfo, ExerciseInfo, EducationalLesson } from "./types";

export const muscleDatabase: MuscleInfo[] = [
  {
    id: "pectoralis-major",
    name: "Peitoral Maior",
    scientificName: "Pectoralis Major",
    group: "peito",
    description:
      "Músculo grande e em forma de leque que cobre a maior parte da parede torácica anterior.",
    functions: [
      "Adução do braço (trazer o braço em direção ao corpo)",
      "Flexão do ombro (elevar o braço para frente)",
      "Rotação interna do braço",
      "Auxilia na respiração forçada",
    ],
    commonExercises: [
      "Supino reto",
      "Supino inclinado",
      "Crucifixo",
      "Flexão de braço",
      "Crossover",
    ],
    anatomyFacts: [
      "Possui duas cabeças: clavicular (superior) e esternocostal (inferior)",
      "A cabeça clavicular é mais ativada em movimentos inclinados",
      "É um dos músculos mais treináveis e responsivos do corpo",
      "Recebe suprimento sanguíneo das artérias torácica e acromial",
    ],
  },
  {
    id: "latissimus-dorsi",
    name: "Grande Dorsal",
    scientificName: "Latissimus Dorsi",
    group: "costas",
    description:
      "O músculo mais largo das costas, responsável pela aparência em V do tronco.",
    functions: [
      "Extensão do ombro (puxar o braço para trás)",
      "Adução do braço",
      "Rotação interna do ombro",
      "Auxilia na respiração forçada",
    ],
    commonExercises: [
      "Barra fixa",
      "Pulldown",
      "Remada curvada",
      "Pullover",
      "Remada unilateral",
    ],
    anatomyFacts: [
      "Origina-se na coluna vertebral inferior e pelve",
      "Insere-se no úmero (osso do braço)",
      "É o músculo mais largo do corpo humano",
      "Crucial para movimentos de escalada e natação",
    ],
  },
  {
    id: "quadriceps",
    name: "Quadríceps",
    scientificName: "Quadriceps Femoris",
    group: "pernas",
    description:
      "Grupo muscular composto por quatro músculos na parte frontal da coxa.",
    functions: [
      "Extensão do joelho (esticar a perna)",
      "Flexão do quadril (reto femoral)",
      "Estabilização da patela",
      "Suporte para caminhar, correr e pular",
    ],
    commonExercises: [
      "Agachamento",
      "Leg press",
      "Cadeira extensora",
      "Avanço",
      "Afundo",
    ],
    anatomyFacts: [
      "Composto por: reto femoral, vasto lateral, vasto medial e vasto intermédio",
      "O reto femoral é o único que cruza duas articulações (quadril e joelho)",
      "Vasto medial é crucial para estabilidade do joelho",
      "Um dos grupos musculares mais fortes do corpo",
    ],
  },
  {
    id: "deltoid",
    name: "Deltoide",
    scientificName: "Deltoideus",
    group: "ombros",
    description:
      "Músculo triangular que cobre a articulação do ombro, responsável pela aparência arredondada.",
    functions: [
      "Abdução do braço (elevar lateralmente)",
      "Flexão do ombro (deltoide anterior)",
      "Extensão do ombro (deltoide posterior)",
      "Rotação do braço",
    ],
    commonExercises: [
      "Desenvolvimento militar",
      "Elevação lateral",
      "Elevação frontal",
      "Remada alta",
      "Crucifixo invertido",
    ],
    anatomyFacts: [
      "Possui três cabeças: anterior, lateral e posterior",
      "Cada cabeça tem funções distintas",
      "Essencial para a mobilidade do ombro em todos os planos",
      "Altamente vascularizado, permitindo recuperação rápida",
    ],
  },
  {
    id: "biceps-brachii",
    name: "Bíceps Braquial",
    scientificName: "Biceps Brachii",
    group: "bracos",
    description:
      "Músculo de duas cabeças localizado na parte frontal do braço.",
    functions: [
      "Flexão do cotovelo (dobrar o braço)",
      "Supinação do antebraço (virar a palma para cima)",
      "Flexão leve do ombro",
      "Estabilização do ombro",
    ],
    commonExercises: [
      "Rosca direta",
      "Rosca martelo",
      "Rosca scott",
      "Rosca inclinada",
      "Rosca concentrada",
    ],
    anatomyFacts: [
      "Possui cabeça longa e cabeça curta",
      "A cabeça longa é mais ativa na rosca inclinada",
      "Atravessa duas articulações: ombro e cotovelo",
      "Trabalha em conjunto com o braquial para flexão do cotovelo",
    ],
  },
  {
    id: "rectus-abdominis",
    name: "Reto Abdominal",
    scientificName: "Rectus Abdominis",
    group: "core",
    description:
      "Músculo longo e plano que forma os 'gominhos' abdominais quando desenvolvido.",
    functions: [
      "Flexão do tronco (aproximar tórax da pelve)",
      "Estabilização da coluna vertebral",
      "Compressão dos órgãos abdominais",
      "Auxilia na respiração forçada e tosse",
    ],
    commonExercises: [
      "Abdominal tradicional",
      "Crunch",
      "Elevação de pernas",
      "Prancha",
      "Abdominal na roldana",
    ],
    anatomyFacts: [
      "Separado pela linha alba no centro",
      "Dividido por intersecções tendíneas que criam os 'gominhos'",
      "O número de gominhos visíveis é genético",
      "Trabalha 24/7 para estabilização postural",
    ],
  },
  {
    id: "gluteus-maximus",
    name: "Glúteo Máximo",
    scientificName: "Gluteus Maximus",
    group: "gluteos",
    description:
      "O maior e mais superficial dos três músculos glúteos, formando as nádegas.",
    functions: [
      "Extensão do quadril (levar a perna para trás)",
      "Rotação lateral do quadril",
      "Estabilização da pelve",
      "Auxílio na posição ereta",
    ],
    commonExercises: [
      "Agachamento",
      "Levantamento terra",
      "Hip thrust",
      "Stiff",
      "Passada",
    ],
    anatomyFacts: [
      "É o maior músculo do corpo humano",
      "Crucial para locomoção bípede (andar ereto)",
      "Altamente responsivo a treino de força",
      "Essencial para corrida e saltos",
    ],
  },
  {
    id: "triceps-brachii",
    name: "Tríceps Braquial",
    scientificName: "Triceps Brachii",
    group: "bracos",
    description:
      "Músculo de três cabeças na parte posterior do braço, responsável por 2/3 do volume do braço.",
    functions: [
      "Extensão do cotovelo (esticar o braço)",
      "Extensão do ombro (cabeça longa)",
      "Estabilização do ombro",
      "Adução do braço (cabeça longa)",
    ],
    commonExercises: [
      "Tríceps testa",
      "Tríceps pulley",
      "Paralelas",
      "Tríceps francês",
      "Fundos",
    ],
    anatomyFacts: [
      "Possui três cabeças: longa, lateral e medial",
      "Representa aproximadamente 60% do volume do braço",
      "A cabeça longa cruza duas articulações (ombro e cotovelo)",
      "Trabalha ativamente em movimentos de empurrar",
    ],
  },
  {
    id: "trapezius",
    name: "Trapézio",
    scientificName: "Trapezius",
    group: "costas",
    description:
      "Músculo grande em formato de trapézio que cobre a parte superior das costas e pescoço.",
    functions: [
      "Elevação das escápulas (parte superior)",
      "Retração das escápulas (parte média)",
      "Depressão das escápulas (parte inferior)",
      "Rotação superior das escápulas",
    ],
    commonExercises: [
      "Encolhimento",
      "Remada alta",
      "Remada curvada",
      "Puxada alta",
      "Face pull",
    ],
    anatomyFacts: [
      "Dividido em três porções: superior, média e inferior",
      "A porção superior é a mais visível (formato de armadilha)",
      "Crucial para estabilização das escápulas",
      "Trabalha constantemente na postura ereta",
    ],
  },
  {
    id: "rhomboids",
    name: "Romboide",
    scientificName: "Rhomboid Major & Minor",
    group: "costas",
    description:
      "Par de músculos localizados entre as escápulas, essenciais para a postura.",
    functions: [
      "Retração das escápulas (puxar para trás)",
      "Elevação das escápulas",
      "Rotação inferior das escápulas",
      "Estabilização das escápulas",
    ],
    commonExercises: [
      "Remada curvada",
      "Remada no cabo",
      "Remada T",
      "Retração de escápulas",
      "Face pull",
    ],
    anatomyFacts: [
      "Composto por romboide maior e romboide menor",
      "Localizado profundamente ao trapézio médio",
      "Crucial para corrigir ombros arredondados",
      "Fraqueza leva a má postura e dor",
    ],
  },
  {
    id: "erector-spinae",
    name: "Eretor da Espinha",
    scientificName: "Erector Spinae",
    group: "costas",
    description:
      "Grupo de músculos que correm ao longo da coluna vertebral, essenciais para manter a postura.",
    functions: [
      "Extensão da coluna vertebral",
      "Rotação lateral da coluna",
      "Estabilização da coluna",
      "Manutenção da postura ereta",
    ],
    commonExercises: [
      "Hiperextensão",
      "Boa manhã",
      "Levantamento terra",
      "Prancha",
      "Superman",
    ],
    anatomyFacts: [
      "Composto por três colunas: ilicostal, longuíssimo e espinhal",
      "Estende-se da pelve até o crânio",
      "Crucial para prevenir lesões na coluna",
      "Ativo durante todo o dia na postura",
    ],
  },
  {
    id: "oblique-abdominis",
    name: "Abdominal Oblíquo",
    scientificName: "Obliquus Externus & Internus Abdominis",
    group: "core",
    description:
      "Músculos localizados nas laterais do tronco, formando a 'cintura'.",
    functions: [
      "Rotação do tronco",
      "Flexão lateral do tronco",
      "Compressão abdominal",
      "Estabilização da coluna",
    ],
    commonExercises: [
      "Prancha lateral",
      "Russian twist",
      "Abdominal oblíquo",
      "Side plank",
      "Cable woodchop",
    ],
    anatomyFacts: [
      "Dividido em oblíquo externo e interno",
      "Fibras em direções opostas (cruzadas)",
      "Formam a camada muscular mais externa do core",
      "Cruciais para rotação e estabilidade",
    ],
  },
  {
    id: "gluteus-medius",
    name: "Glúteo Médio",
    scientificName: "Gluteus Medius",
    group: "gluteos",
    description:
      "Músculo localizado na parte lateral do quadril, essencial para estabilização.",
    functions: [
      "Abdução do quadril (afastar a perna)",
      "Estabilização do quadril durante caminhada",
      "Rotação interna do quadril (fibras anteriores)",
      "Rotação externa do quadril (fibras posteriores)",
    ],
    commonExercises: [
      "Elevação lateral de perna",
      "Clamshell",
      "Lateral walk",
      "Single leg squat",
      "Fire hydrant",
    ],
    anatomyFacts: [
      "Localizado profundamente ao glúteo máximo",
      "Crucial para prevenir dor no joelho e quadril",
      "Fraqueza causa queda pélvica durante caminhada",
      "Trabalha ativamente em movimentos unilaterais",
    ],
  },
  {
    id: "hamstrings",
    name: "Isquiotibiais",
    scientificName: "Biceps Femoris, Semitendinosus, Semimembranosus",
    group: "pernas",
    description:
      "Grupo de três músculos na parte posterior da coxa, essenciais para flexão do joelho.",
    functions: [
      "Flexão do joelho (dobrar a perna)",
      "Extensão do quadril (levar a perna para trás)",
      "Rotação interna e externa do joelho",
      "Desaceleração durante corrida",
    ],
    commonExercises: [
      "Mesa flexora",
      "Stiff",
      "Leg curl",
      "Nordic curl",
      "RDL",
    ],
    anatomyFacts: [
      "Composto por: bíceps femoral, semitendinoso e semimembranoso",
      "Todos cruzam as articulações do quadril e joelho",
      "Grupo muscular frequentemente desequilibrado",
      "Crucial para saúde dos joelhos",
    ],
  },
  {
    id: "gastrocnemius",
    name: "Gastrocnêmio",
    scientificName: "Gastrocnemius",
    group: "pernas",
    description:
      "O maior músculo da panturrilha, formando a parte superior e mais visível.",
    functions: [
      "Flexão plantar (ficar na ponta dos pés)",
      "Flexão do joelho (leve)",
      "Propulsão durante caminhada e corrida",
      "Estabilização do tornozelo",
    ],
    commonExercises: [
      "Panturrilha em pé",
      "Panturrilha no leg press",
      "Elevação de panturrilha",
      "Panturrilha sentado",
      "Calf raise",
    ],
    anatomyFacts: [
      "Possui duas cabeças: medial e lateral",
      "Localizado superficialmente ao sóleo",
      "Mais ativo com joelho estendido",
      "Altamente responsivo ao treino",
    ],
  },
  {
    id: "soleus",
    name: "Sóleo",
    scientificName: "Soleus",
    group: "pernas",
    description:
      "Músculo plano e largo localizado profundamente ao gastrocnêmio na panturrilha.",
    functions: [
      "Flexão plantar (principal função)",
      "Estabilização da perna durante caminhada",
      "Suporte venoso (bomba muscular)",
      "Postura em pé",
    ],
    commonExercises: [
      "Panturrilha sentado",
      "Panturrilha no leg press",
      "Panturrilha unipodal",
      "Calf raise sentado",
    ],
    anatomyFacts: [
      "Localizado profundamente ao gastrocnêmio",
      "Mais ativo com joelho flexionado",
      "Contém maior porcentagem de fibras de resistência",
      "Essencial para bomba venosa (circulação)",
    ],
  },
  {
    id: "forearms",
    name: "Antebraços",
    scientificName: "Flexor & Extensor Carpi, Brachioradialis",
    group: "bracos",
    description:
      "Grupo de músculos que controlam os movimentos do punho e dedos.",
    functions: [
      "Flexão do punho",
      "Extensão do punho",
      "Pronação e supinação",
      "Fortalecimento de pegada",
    ],
    commonExercises: [
      "Rosca punho",
      "Extensão de punho",
      "Martelo",
      "Farmer's walk",
      "Rolinho de punho",
    ],
    anatomyFacts: [
      "Composto por mais de 20 músculos pequenos",
      "Crucial para força de pegada",
      "Trabalha em todos os exercícios de puxar",
      "Alto potencial de crescimento",
    ],
  },
  {
    id: "serratus-anterior",
    name: "Serrátil Anterior",
    scientificName: "Serratus Anterior",
    group: "peito",
    description:
      "Músculo localizado nas laterais do tórax, conhecido como 'caixa torácica'.",
    functions: [
      "Protração das escápulas (empurrar para frente)",
      "Rotação superior das escápulas",
      "Estabilização das escápulas",
      "Fixação da escápula ao tórax",
    ],
    commonExercises: [
      "Flexão de braço",
      "Prancha com protração",
      "Serrate press",
      "Dip",
      "Wall slide",
    ],
    anatomyFacts: [
      "Forma as 'abas' visíveis nas laterais do peito",
      "Crucial para movimentos de empurrar",
      "Fraqueza causa 'asas de anjo' (escápulas destacadas)",
      "Trabalha sinergicamente com peitoral",
    ],
  },
  {
    id: "teres-major",
    name: "Redondo Maior",
    scientificName: "Teres Major",
    group: "costas",
    description:
      "Músculo redondo localizado na parte inferior das costas, trabalhando com o grande dorsal.",
    functions: [
      "Adução do braço",
      "Extensão do ombro",
      "Rotação interna do ombro",
      "Estabilização do ombro",
    ],
    commonExercises: [
      "Remada curvada",
      "Pulldown",
      "Pullover",
      "Remada unilateral",
      "Barra fixa",
    ],
    anatomyFacts: [
      "Trabalha em conjunto com o grande dorsal",
      "Localizado próximo ao tríceps",
      "Conhecido como 'pequeno latíssimo'",
      "Crucial para força de puxar",
    ],
  },
  {
    id: "infraspinatus",
    name: "Infraespinhal",
    scientificName: "Infraspinatus",
    group: "ombros",
    description:
      "Músculo do manguito rotador localizado na escápula, essencial para estabilidade do ombro.",
    functions: [
      "Rotação externa do ombro",
      "Abdução do ombro (leve)",
      "Estabilização da cabeça do úmero",
      "Proteção da articulação do ombro",
    ],
    commonExercises: [
      "Rotação externa",
      "Face pull",
      "Rotação externa deitado",
      "Band pull-apart",
      "Cable external rotation",
    ],
    anatomyFacts: [
      "Parte do manguito rotador",
      "Frequentemente fraco em praticantes de musculação",
      "Crucial para prevenir lesões no ombro",
      "Trabalha em antagonismo ao peitoral",
    ],
  },
  {
    id: "supraspinatus",
    name: "Supraespinhal",
    scientificName: "Supraspinatus",
    group: "ombros",
    description: "Músculo do manguito rotador que inicia a abdução do braço.",
    functions: [
      "Abdução do braço (primeiros 15 graus)",
      "Estabilização do ombro",
      "Assistência na abdução total",
      "Proteção da articulação",
    ],
    commonExercises: [
      "Elevação lateral",
      "Rotação interna",
      "Pendulum",
      "Empty can",
      "Prone Y",
    ],
    anatomyFacts: [
      "Inicia o movimento de elevação lateral",
      "Mais comum lesão do manguito rotador",
      "Trabalha com deltoide na abdução",
      "Localizado na fossa supraespinhal da escápula",
    ],
  },
  {
    id: "pectoralis-minor",
    name: "Peitoral Menor",
    scientificName: "Pectoralis Minor",
    group: "peito",
    description:
      "Músculo pequeno localizado profundamente ao peitoral maior, conectando escápula às costelas.",
    functions: [
      "Depressão das escápulas",
      "Protração das escápulas",
      "Rotação inferior das escápulas",
      "Elevação das costelas (respiração)",
    ],
    commonExercises: [
      "Flexão de braço",
      "Dips",
      "Puxada",
      "Remada",
      "Pullover",
    ],
    anatomyFacts: [
      "Localizado profundamente ao peitoral maior",
      "Pode causar síndrome do desfiladeiro torácico",
      "Encurtamento comum em pessoas com má postura",
      "Trabalha em movimentos de empurrar",
    ],
  },
  {
    id: "transverse-abdominis",
    name: "Transverso Abdominal",
    scientificName: "Transversus Abdominis",
    group: "core",
    description:
      "Músculo mais profundo do abdômen, funcionando como um cinto natural.",
    functions: [
      "Compressão abdominal",
      "Estabilização da coluna lombar",
      "Suporte dos órgãos internos",
      "Exalação forçada",
    ],
    commonExercises: [
      "Prancha",
      "Dead bug",
      "Bird dog",
      "Hollow hold",
      "Vacuum",
    ],
    anatomyFacts: [
      "Músculo mais profundo do core",
      "Funciona como um cinto interno",
      "Ativo antes de qualquer movimento",
      "Crucial para estabilidade lombar",
    ],
  },
  {
    id: "hip-flexors",
    name: "Flexores do Quadril",
    scientificName: "Iliopsoas, Rectus Femoris",
    group: "pernas",
    description: "Grupo de músculos que elevam a perna em direção ao tronco.",
    functions: [
      "Flexão do quadril (elevar a perna)",
      "Estabilização do quadril",
      "Assistência na extensão do joelho (reto femoral)",
      "Postura em pé",
    ],
    commonExercises: [
      "Elevação de perna",
      "Leg raise",
      "Knee raise",
      "Mountain climber",
      "Hip flexor stretch",
    ],
    anatomyFacts: [
      "Composto principalmente por psoas e ilíaco",
      "Frequentemente encurtado em pessoas sedentárias",
      "Crucial para corrida e chutes",
      "Trabalha constantemente na postura",
    ],
  },
  {
    id: "adductors",
    name: "Adutores",
    scientificName: "Adductor Magnus, Longus, Brevis",
    group: "pernas",
    description:
      "Grupo de músculos na parte interna da coxa que aproximam as pernas.",
    functions: [
      "Adução do quadril (aproximar as pernas)",
      "Estabilização do quadril",
      "Flexão e extensão do quadril (dependendo da porção)",
      "Rotação interna",
    ],
    commonExercises: [
      "Adutora na máquina",
      "Sumo squat",
      "Leg press sumo",
      "Side lunge",
      "Copenhagen plank",
    ],
    anatomyFacts: [
      "Composto por adutor magno, longo e curto",
      "Frequentemente negligenciado no treino",
      "Crucial para estabilidade do quadril",
      "Trabalha em movimentos de agachamento",
    ],
  },
];

export const exerciseDatabase: ExerciseInfo[] = [
  {
    id: "bench-press",
    name: "Supino Reto",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Barra", "Banco", "Anilhas"],
    instructions: [
      "Deite-se no banco com os pés apoiados no chão",
      "Pegue a barra com pegada ligeiramente mais larga que os ombros",
      "Desça a barra controladamente até tocar o peito",
      "Empurre a barra de volta à posição inicial",
      "Mantenha os omoplatas retraídos durante todo o movimento",
    ],
    tips: [
      "Mantenha os cotovelos a 45 graus do corpo, não 90 graus",
      "Crie um pequeno arco nas costas",
      "Empurre através da linha média do peito",
      "Respire fundo antes de descer, expire ao empurrar",
    ],
    commonMistakes: [
      "Bater a barra no peito sem controle",
      "Cotovelos muito abertos (90 graus)",
      "Tirar os glúteos do banco",
      "Não usar amplitude completa",
      "Movimentos assimétricos da barra",
    ],
    benefits: [
      "Desenvolvimento completo do peitoral",
      "Aumento de força do tronco superior",
      "Transferência para movimentos funcionais de empurrar",
      "Estímulo hormonal para crescimento muscular",
    ],
    scientificEvidence:
      "Estudos eletromiográficos mostram que o supino reto ativa significativamente as três porções do peitoral, com ênfase na porção esternocostal.",
  },
  {
    id: "squat",
    name: "Agachamento Livre",
    primaryMuscles: ["pernas", "gluteos"],
    secondaryMuscles: ["core", "costas"],
    difficulty: "intermediario",
    equipment: ["Barra", "Rack", "Anilhas"],
    instructions: [
      "Posicione a barra sobre o trapézio superior",
      "Pés na largura dos ombros, ligeiramente abertos",
      "Desça flexionando quadris e joelhos simultaneamente",
      "Mantenha o tronco ereto e joelhos alinhados com os pés",
      "Desça até quadris abaixo da linha dos joelhos",
      "Suba empurrando através dos calcanhares",
    ],
    tips: [
      "Mantenha o core contraído durante todo movimento",
      "Olhe ligeiramente para cima para manter coluna neutra",
      "Joelhos devem seguir a direção dos pés",
      "Inspire na descida, expire na subida",
    ],
    commonMistakes: [
      "Joelhos colapsando para dentro",
      "Calcanhar saindo do chão",
      "Tronco inclinando demais para frente",
      "Não atingir profundidade adequada",
      "Perder tensão no core",
    ],
    benefits: [
      "Desenvolvimento completo de membros inferiores",
      "Aumento de força funcional",
      "Estímulo à produção de hormônios anabólicos",
      "Melhora de mobilidade e estabilidade",
      "Fortalecimento do core",
    ],
    scientificEvidence:
      "Pesquisas demonstram que o agachamento profundo ativa mais fibras dos quadríceps e glúteos comparado ao agachamento parcial, além de ser seguro para joelhos saudáveis.",
  },
  {
    id: "deadlift",
    name: "Levantamento Terra",
    primaryMuscles: ["costas", "gluteos", "pernas"],
    secondaryMuscles: ["core", "bracos"],
    difficulty: "avancado",
    equipment: ["Barra", "Anilhas"],
    instructions: [
      "Posicione-se com pés sob a barra, na largura dos quadris",
      "Segure a barra com pegada pronada ou mista",
      "Mantenha coluna neutra, peito para cima",
      "Empurre o chão com os pés enquanto puxa a barra",
      "Estenda quadris e joelhos simultaneamente",
      "Finalize em posição ereta com ombros para trás",
    ],
    tips: [
      "A barra deve deslizar próxima ao corpo",
      "Ative o latíssimo para estabilizar a barra",
      "Pense em 'empurrar o chão' e não 'puxar a barra'",
      "Mantenha o core fortemente contraído",
    ],
    commonMistakes: [
      "Arredondar a coluna lombar",
      "Barra longe do corpo",
      "Puxar com os braços ao invés das pernas",
      "Hiperextensão na posição final",
      "Descer a barra sem controle",
    ],
    benefits: [
      "Exercício mais completo para corpo todo",
      "Desenvolvimento extremo de força posterior",
      "Fortalecimento de pegada",
      "Melhora de postura",
      "Alto gasto calórico",
    ],
    scientificEvidence:
      "Considerado o exercício com maior ativação muscular total, recrutando mais de 200 músculos simultaneamente segundo análises biomecânicas.",
  },
  {
    id: "pull-up",
    name: "Barra Fixa",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "ombros", "core"],
    difficulty: "intermediario",
    equipment: ["Barra fixa"],
    instructions: [
      "Segure a barra com pegada pronada (palmas para frente)",
      "Mãos ligeiramente mais largas que os ombros",
      "Puxe os cotovelos para baixo e para trás",
      "Eleve o corpo até queixo passar a barra",
      "Desça controladamente até extensão completa",
    ],
    tips: [
      "Inicie o movimento retraindo as escápulas",
      "Pense em puxar os cotovelos, não as mãos",
      "Mantenha o core ativo para evitar balanço",
      "Use pegada completa (polegar envolvendo a barra)",
    ],
    commonMistakes: [
      "Usar impulso do corpo (kipping)",
      "Não usar amplitude completa",
      "Projetar os ombros para frente",
      "Elevar apenas usando bíceps",
      "Não controlar a descida",
    ],
    benefits: [
      "Desenvolvimento completo das costas",
      "Melhora de força relativa",
      "Fortalecimento de pegada",
      "Desenvolvimento funcional",
      "Versatilidade (várias variações)",
    ],
    scientificEvidence:
      "EMG mostra que a barra fixa ativa significativamente mais o grande dorsal comparado a máquinas de pulldown, especialmente na fase excêntrica.",
  },
  {
    id: "tricep-extension",
    name: "Tríceps Testa",
    primaryMuscles: ["bracos"],
    secondaryMuscles: ["ombros"],
    difficulty: "iniciante",
    equipment: ["Barra", "Banco", "Anilhas"],
    instructions: [
      "Deite-se no banco com os pés no chão",
      "Segure a barra com pegada fechada",
      "Posicione a barra acima da cabeça com braços estendidos",
      "Flexione os cotovelos e desça a barra em direção à testa",
      "Estenda os braços até voltar à posição inicial",
    ],
    tips: [
      "Mantenha os cotovelos fixos, apontando para cima",
      "Não abra os cotovelos durante o movimento",
      "Controle a fase excêntrica",
      "Mantenha o core ativo",
    ],
    commonMistakes: [
      "Abrir os cotovelos durante o movimento",
      "Usar peso excessivo comprometendo a forma",
      "Arquear excessivamente as costas",
      "Não usar amplitude completa",
    ],
    benefits: [
      "Desenvolvimento isolado do tríceps",
      "Ativa todas as três cabeças",
      "Melhora força de extensão",
      "Aumento do volume do braço",
    ],
    scientificEvidence:
      "Estudos EMG mostram alta ativação das três cabeças do tríceps, especialmente a cabeça longa.",
  },
  {
    id: "tricep-pushdown",
    name: "Tríceps Pulley",
    primaryMuscles: ["bracos"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Cabo", "Polia"],
    instructions: [
      "Posicione-se frente à polia alta",
      "Segure a barra com pegada pronada",
      "Mantenha cotovelos junto ao corpo",
      "Estenda os braços completamente para baixo",
      "Retorne controladamente à posição inicial",
    ],
    tips: [
      "Mantenha os cotovelos fixos junto ao corpo",
      "Não balance o corpo para ajudar",
      "Use pegada em V para maior ativação",
      "Sinta a contração no tríceps",
    ],
    commonMistakes: [
      "Abrir os cotovelos",
      "Usar impulso do corpo",
      "Não estender completamente",
      "Inclinar o tronco para frente",
    ],
    benefits: [
      "Isolamento efetivo do tríceps",
      "Técnica relativamente simples",
      "Permite altas repetições",
      "Menor estresse articular",
    ],
    scientificEvidence:
      "Exercício isolador efetivo para tríceps com baixa ativação de músculos secundários.",
  },
  {
    id: "dips",
    name: "Paralelas",
    primaryMuscles: ["bracos"],
    secondaryMuscles: ["peito", "ombros"],
    difficulty: "intermediario",
    equipment: ["Barras paralelas"],
    instructions: [
      "Segure nas barras paralelas com braços estendidos",
      "Incline ligeiramente o tronco para frente",
      "Desça flexionando os cotovelos",
      "Desça até ombros ficarem abaixo dos cotovelos",
      "Empurre de volta à posição inicial",
    ],
    tips: [
      "Mantenha o core contraído",
      "Controle a descida",
      "Não deixe os ombros rodarem para frente",
      "Use assistência se necessário",
    ],
    commonMistakes: [
      "Não descer o suficiente",
      "Inclinar muito para frente (ativa mais peito)",
      "Deixar ombros caírem para frente",
      "Usar impulso",
    ],
    benefits: [
      "Exercício composto para tríceps e peito",
      "Desenvolvimento de força relativa",
      "Funcional e transferível",
      "Não requer equipamento adicional",
    ],
    scientificEvidence:
      "Exercício composto que ativa significativamente tríceps, peitoral e deltoide anterior.",
  },
  {
    id: "barbell-shrug",
    name: "Encolhimento com Barra",
    primaryMuscles: ["costas"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Barra", "Anilhas"],
    instructions: [
      "Fique em pé segurando a barra com pegada pronada",
      "Mantenha os braços estendidos",
      "Eleve os ombros o máximo possível",
      "Mantenha a contração por 1-2 segundos",
      "Desça controladamente",
    ],
    tips: [
      "Não gire os ombros (movimento apenas para cima)",
      "Use peso adequado para amplitude completa",
      "Mantenha o tronco ereto",
      "Não flexione os cotovelos",
    ],
    commonMistakes: [
      "Rotacionar os ombros",
      "Usar peso excessivo reduzindo amplitude",
      "Flexionar os cotovelos",
      "Arquear as costas",
    ],
    benefits: [
      "Desenvolvimento direto do trapézio superior",
      "Melhora da postura",
      "Fortalecimento para levantamento terra",
      "Exercício isolado efetivo",
    ],
    scientificEvidence:
      "EMG mostra alta ativação do trapézio superior, especialmente na parte medial.",
  },
  {
    id: "upright-row",
    name: "Remada Alta",
    primaryMuscles: ["ombros", "costas"],
    secondaryMuscles: ["bracos"],
    difficulty: "intermediario",
    equipment: ["Barra", "Anilhas"],
    instructions: [
      "Fique em pé segurando a barra com pegada fechada",
      "Puxe a barra verticalmente até a altura do peito",
      "Mantenha os cotovelos acima dos punhos",
      "Contraia o trapézio no topo",
      "Desça controladamente",
    ],
    tips: [
      "Não eleve acima da altura do peito",
      "Mantenha os cotovelos altos",
      "Controle o movimento em ambas as fases",
      "Evite balançar o corpo",
    ],
    commonMistakes: [
      "Elevar demais (pode causar impingimento)",
      "Usar pegada muito larga",
      "Balançar o corpo",
      "Puxar com os braços ao invés das costas",
    ],
    benefits: [
      "Desenvolvimento do trapézio médio e deltoides",
      "Melhora da força de puxar vertical",
      "Exercício composto efetivo",
      "Aumenta largura dos ombros",
    ],
    scientificEvidence:
      "Ativa trapézio médio e deltoides, mas cuidado com impingimento em elevadas altas.",
  },
  {
    id: "face-pull",
    name: "Face Pull",
    primaryMuscles: ["costas", "ombros"],
    secondaryMuscles: ["bracos"],
    difficulty: "iniciante",
    equipment: ["Cabo", "Polia"],
    instructions: [
      "Ajuste a polia na altura dos olhos",
      "Segure a corda com pegada neutra",
      "Puxe em direção ao rosto separando as cordas",
      "Contraia o trapézio médio e posterior",
      "Retorne controladamente",
    ],
    tips: [
      "Puxe para os lados do rosto, não para o centro",
      "Retraia as escápulas durante o movimento",
      "Mantenha o tronco ereto",
      "Use peso moderado para técnica correta",
    ],
    commonMistakes: [
      "Puxar para o centro do rosto",
      "Não retrair as escápulas",
      "Usar peso excessivo",
      "Arquear as costas",
    ],
    benefits: [
      "Desenvolvimento do deltoide posterior",
      "Fortalecimento dos romboides e trapézio médio",
      "Corrige desequilíbrios posturais",
      "Previne lesões no ombro",
    ],
    scientificEvidence:
      "Excelente para manguito rotador e deltoide posterior, músculos frequentemente negligenciados.",
  },
  {
    id: "hyperextension",
    name: "Hiperextensão Lombar",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["gluteos"],
    difficulty: "iniciante",
    equipment: ["Banco de hiperextensão"],
    instructions: [
      "Posicione-se no banco com quadril apoiado",
      "Cruze os braços no peito ou atrás da cabeça",
      "Desça o tronco controladamente",
      "Estenda o tronco até alinhamento com as pernas",
      "Contraia os eretores da espinha",
    ],
    tips: [
      "Não hiperestender excessivamente",
      "Mantenha o movimento controlado",
      "Foque em contrair os lombares",
      "Não use impulso",
    ],
    commonMistakes: [
      "Hiperestender demais na posição final",
      "Usar impulso",
      "Focar em amplitude excessiva",
      "Não controlar a descida",
    ],
    benefits: [
      "Fortalecimento dos eretores da espinha",
      "Melhora da postura",
      "Prevenção de lesões lombares",
      "Auxilia em levantamento terra e agachamento",
    ],
    scientificEvidence:
      "Exercício isolado efetivo para eretores da espinha, crucial para saúde lombar.",
  },
  {
    id: "good-morning",
    name: "Boa Manhã",
    primaryMuscles: ["costas", "gluteos"],
    secondaryMuscles: ["pernas"],
    difficulty: "avancado",
    equipment: ["Barra", "Anilhas"],
    instructions: [
      "Posicione a barra sobre os trapézios",
      "Pés na largura dos quadris",
      "Flexione os quadris mantendo pernas retas",
      "Incline o tronco até paralelo ao chão",
      "Retorne à posição ereta contraindo os glúteos",
    ],
    tips: [
      "Mantenha coluna neutra durante todo movimento",
      "Foque em dobrar pelos quadris",
      "Use peso conservador inicialmente",
      "Contraia os glúteos para retornar",
    ],
    commonMistakes: [
      "Arredondar as costas",
      "Flexionar os joelhos demais",
      "Usar peso excessivo",
      "Não manter coluna neutra",
    ],
    benefits: [
      "Fortalecimento posterior completo",
      "Desenvolvimento de força dos eretores",
      "Melhora de padrão de dobradiça de quadril",
      "Transferência para levantamento terra",
    ],
    scientificEvidence:
      "Exercício de cadeia posterior que desenvolve força funcional e previne lesões.",
  },
  {
    id: "side-plank",
    name: "Prancha Lateral",
    primaryMuscles: ["core"],
    secondaryMuscles: ["ombros"],
    difficulty: "intermediario",
    equipment: [],
    instructions: [
      "Deite-se de lado apoiado no antebraço",
      "Estenda as pernas com pés empilhados",
      "Eleve o quadril do chão",
      "Mantenha corpo em linha reta",
      "Segure a posição",
    ],
    tips: [
      "Mantenha o corpo em linha reta",
      "Não deixe o quadril cair",
      "Respire normalmente",
      "Ative o core e oblíquos",
    ],
    commonMistakes: [
      "Deixar o quadril cair",
      "Arquear o corpo",
      "Colocar muito peso no braço",
      "Não ativar os oblíquos",
    ],
    benefits: [
      "Fortalecimento dos oblíquos",
      "Estabilização lateral do core",
      "Melhora da postura",
      "Prevenção de lesões",
    ],
    scientificEvidence:
      "Alta ativação do oblíquo externo e interno, essencial para estabilidade lateral.",
  },
  {
    id: "russian-twist",
    name: "Russian Twist",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    difficulty: "intermediario",
    equipment: ["Peso opcional"],
    instructions: [
      "Sente-se no chão com joelhos flexionados",
      "Incline o tronco para trás mantendo costas retas",
      "Eleve os pés do chão",
      "Rode o tronco de um lado para o outro",
      "Mantenha o core contraído",
    ],
    tips: [
      "Mantenha o tronco inclinado mas reto",
      "Controle o movimento",
      "Não balance o peso rapidamente",
      "Foque na contração dos oblíquos",
    ],
    commonMistakes: [
      "Arredondar as costas",
      "Balancer muito rápido",
      "Não manter os pés elevados",
      "Usar impulso",
    ],
    benefits: [
      "Desenvolvimento dos oblíquos",
      "Melhora da rotação do tronco",
      "Fortalecimento do core",
      "Exercício funcional",
    ],
    scientificEvidence:
      "Alta ativação dos oblíquos e reto abdominal durante rotação do tronco.",
  },
  {
    id: "cable-woodchop",
    name: "Cable Woodchop",
    primaryMuscles: ["core"],
    secondaryMuscles: ["ombros"],
    difficulty: "intermediario",
    equipment: ["Cabo", "Polia"],
    instructions: [
      "Ajuste a polia na altura máxima",
      "Segure o cabo com ambas as mãos",
      "Rode o tronco puxando diagonalmente",
      "Termine com o cabo na altura do quadril oposto",
      "Retorne controladamente",
    ],
    tips: [
      "Mantenha os braços relativamente retos",
      "Rode pelo tronco, não pelos braços",
      "Mantenha os pés plantados",
      "Controle ambas as fases",
    ],
    commonMistakes: [
      "Usar apenas os braços",
      "Não rotacionar o tronco",
      "Perder estabilidade",
      "Movimento muito rápido",
    ],
    benefits: [
      "Desenvolvimento funcional dos oblíquos",
      "Melhora de rotação e força",
      "Exercício anti-rotação",
      "Transferência para esportes",
    ],
    scientificEvidence:
      "Exercício funcional que desenvolve força rotacional, importante para atividades diárias e esportes.",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    primaryMuscles: ["gluteos"],
    secondaryMuscles: ["pernas", "costas"],
    difficulty: "intermediario",
    equipment: ["Barra", "Banco", "Anilhas"],
    instructions: [
      "Apoie as costas no banco com omoplatas",
      "Posicione a barra sobre os quadris",
      "Pés no chão, joelhos a 90 graus",
      "Eleve os quadris até formar linha reta",
      "Contraia os glúteos no topo",
    ],
    tips: [
      "Mantenha o queixo próximo ao peito",
      "Contraia os glúteos antes de subir",
      "Não hiperestender na posição final",
      "Empurre através dos calcanhares",
    ],
    commonMistakes: [
      "Hiperestender a coluna",
      "Não contrair os glúteos",
      "Joelhos muito à frente",
      "Movimento muito curto",
    ],
    benefits: [
      "Desenvolvimento máximo dos glúteos",
      "Melhora de força do quadril",
      "Corrige desequilíbrios",
      "Alto estímulo muscular",
    ],
    scientificEvidence:
      "EMG mostra maior ativação do glúteo máximo comparado a agachamento e levantamento terra.",
  },
  {
    id: "glute-bridge",
    name: "Ponte de Glúteo",
    primaryMuscles: ["gluteos"],
    secondaryMuscles: ["pernas"],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Deite-se de costas com joelhos flexionados",
      "Pés no chão na largura dos quadris",
      "Eleve os quadris contraindo os glúteos",
      "Mantenha a contração no topo",
      "Desça controladamente",
    ],
    tips: [
      "Foque em contrair os glúteos",
      "Não arquear excessivamente as costas",
      "Mantenha o core ativo",
      "Pode adicionar peso para progressão",
    ],
    commonMistakes: [
      "Arquear demais as costas",
      "Não contrair os glúteos",
      "Usar os quadríceps em vez dos glúteos",
      "Movimento muito rápido",
    ],
    benefits: [
      "Ativação efetiva dos glúteos",
      "Exercício acessível sem equipamento",
      "Melhora de ativação glútea",
      "Auxilia em outros exercícios",
    ],
    scientificEvidence:
      "Exercício de ativação glútea efetivo, especialmente útil para pessoas com glúteos inativos.",
  },
  {
    id: "lateral-leg-raise",
    name: "Elevação Lateral de Perna",
    primaryMuscles: ["gluteos"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Deite-se de lado apoiado no antebraço",
      "Mantenha pernas estendidas e empilhadas",
      "Eleve a perna superior o máximo possível",
      "Mantenha a perna reta",
      "Desça controladamente",
    ],
    tips: [
      "Foque em elevar pelo quadril, não pela perna",
      "Mantenha o tronco estável",
      "Não balance a perna",
      "Sinta a contração no glúteo médio",
    ],
    commonMistakes: [
      "Girar o corpo para ajudar",
      "Elevar muito rápido",
      "Não manter a perna reta",
      "Não sentir contração no glúteo",
    ],
    benefits: [
      "Isolamento do glúteo médio",
      "Melhora de estabilidade do quadril",
      "Prevenção de lesões no joelho",
      "Corrige desequilíbrios",
    ],
    scientificEvidence:
      "Exercício isolado efetivo para glúteo médio, crucial para estabilidade do quadril e prevenção de lesões.",
  },
  {
    id: "leg-curl",
    name: "Mesa Flexora",
    primaryMuscles: ["pernas"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Máquina de leg curl"],
    instructions: [
      "Deite-se na máquina com as pernas sob o apoio",
      "Ajuste o apoio para ficar acima dos calcanhares",
      "Flexione os joelhos trazendo os calcanhares aos glúteos",
      "Contraia os isquiotibiais no topo",
      "Estenda controladamente",
    ],
    tips: [
      "Mantenha os quadris no banco",
      "Controle a fase excêntrica",
      "Não use impulso",
      "Foque em contrair os isquiotibiais",
    ],
    commonMistakes: [
      "Elevar os quadris do banco",
      "Usar peso excessivo",
      "Não controlar a descida",
      "Não usar amplitude completa",
    ],
    benefits: [
      "Isolamento efetivo dos isquiotibiais",
      "Desenvolvimento de força de flexão",
      "Balanceamento com quadríceps",
      "Prevenção de lesões",
    ],
    scientificEvidence:
      "EMG mostra alta ativação dos três músculos isquiotibiais durante flexão do joelho.",
  },
  {
    id: "nordic-curl",
    name: "Nordic Curl",
    primaryMuscles: ["pernas"],
    secondaryMuscles: ["gluteos", "core"],
    difficulty: "avancado",
    equipment: ["Parceiro ou apoio"],
    instructions: [
      "Ajoelhe-se no chão com os calcanhares fixos",
      "Mantenha o corpo reto",
      "Desça controladamente deixando o corpo inclinar",
      "Quando não conseguir mais, empurre de volta",
      "Ou use as mãos para assistir na subida",
    ],
    tips: [
      "Comece com movimento assistido",
      "Foque em controlar a descida",
      "Mantenha o core ativo",
      "Progressão gradual é essencial",
    ],
    commonMistakes: [
      "Descer muito rápido",
      "Não controlar o movimento",
      "Arredondar as costas",
      "Tentar fazer sem preparação",
    ],
    benefits: [
      "Fortalecimento excêntrico dos isquiotibiais",
      "Prevenção de lesões",
      "Exercício de peso corporal desafiador",
      "Melhora de força funcional",
    ],
    scientificEvidence:
      "Exercício excêntrico altamente efetivo para isquiotibiais, importante para prevenção de lesões.",
  },
  {
    id: "romanian-deadlift",
    name: "Stiff (RDL)",
    primaryMuscles: ["pernas", "gluteos"],
    secondaryMuscles: ["costas"],
    difficulty: "intermediario",
    equipment: ["Barra", "Anilhas"],
    instructions: [
      "Segure a barra com pegada pronada",
      "Pés na largura dos quadris",
      "Flexione levemente os joelhos",
      "Dobre pelos quadris mantendo costas retas",
      "Desça a barra até sentir alongamento nos isquiotibiais",
      "Retorne contraindo os glúteos",
    ],
    tips: [
      "Mantenha a barra próxima ao corpo",
      "Foque em dobrar pelos quadris",
      "Mantenha joelhos levemente flexionados",
      "Sinta o alongamento nos isquiotibiais",
    ],
    commonMistakes: [
      "Flexionar demais os joelhos",
      "Arredondar as costas",
      "Barra longe do corpo",
      "Não sentir alongamento",
    ],
    benefits: [
      "Desenvolvimento de isquiotibiais e glúteos",
      "Melhora de mobilidade do quadril",
      "Força da cadeia posterior",
      "Transferência funcional",
    ],
    scientificEvidence:
      "Exercício da cadeia posterior que desenvolve isquiotibiais e glúteos com alta ativação EMG.",
  },
  {
    id: "standing-calf-raise",
    name: "Panturrilha em Pé",
    primaryMuscles: ["pernas"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Máquina de panturrilha ou step"],
    instructions: [
      "Posicione os pés na máquina ou step",
      "Mantenha joelhos estendidos",
      "Eleve os calcanhares o máximo possível",
      "Contraia as panturrilhas no topo",
      "Desça até sentir alongamento completo",
    ],
    tips: [
      "Use amplitude completa de movimento",
      "Não balance o corpo",
      "Mantenha os joelhos estendidos",
      "Controle ambas as fases",
    ],
    commonMistakes: [
      "Não usar amplitude completa",
      "Balancear o corpo",
      "Flexionar os joelhos",
      "Movimento muito rápido",
    ],
    benefits: [
      "Desenvolvimento do gastrocnêmio",
      "Melhora de força de flexão plantar",
      "Estética das pernas",
      "Desempenho em saltos",
    ],
    scientificEvidence:
      "Ativa principalmente o gastrocnêmio devido à extensão do joelho, ideal para desenvolvimento da panturrilha superior.",
  },
  {
    id: "seated-calf-raise",
    name: "Panturrilha Sentado",
    primaryMuscles: ["pernas"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Máquina de panturrilha sentado"],
    instructions: [
      "Sente-se na máquina com joelhos flexionados a 90 graus",
      "Posicione as coxas sob o apoio",
      "Eleve os calcanhares o máximo possível",
      "Contraia as panturrilhas",
      "Desça até alongamento completo",
    ],
    tips: [
      "Use amplitude completa",
      "Foque no sóleo (panturrilha inferior)",
      "Mantenha os joelhos flexionados",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Não usar amplitude completa",
      "Estender os joelhos",
      "Não sentir contração",
      "Usar peso excessivo",
    ],
    benefits: [
      "Desenvolvimento do sóleo",
      "Completa o desenvolvimento da panturrilha",
      "Trabalha com joelho flexionado",
      "Aumenta espessura da panturrilha",
    ],
    scientificEvidence:
      "Com joelho flexionado, ativa principalmente o sóleo, completando o desenvolvimento da panturrilha.",
  },
  {
    id: "wrist-curl",
    name: "Rosca de Punho",
    primaryMuscles: ["bracos"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Barra ou halteres"],
    instructions: [
      "Sente-se segurando a barra com pegada supinada",
      "Apoie os antebraços no banco",
      "Punhos devem ficar além da borda",
      "Flexione os punhos elevando a barra",
      "Desça controladamente até alongamento completo",
    ],
    tips: [
      "Use amplitude completa",
      "Mantenha os antebraços apoiados",
      "Controle o movimento",
      "Não balance",
    ],
    commonMistakes: [
      "Não usar amplitude completa",
      "Balancear os antebraços",
      "Usar peso excessivo",
      "Movimento muito rápido",
    ],
    benefits: [
      "Fortalecimento dos flexores do punho",
      "Melhora de força de pegada",
      "Prevenção de lesões",
      "Desenvolvimento estético",
    ],
    scientificEvidence:
      "Exercício isolado para flexores do punho, importante para força de pegada e prevenção de lesões.",
  },
  {
    id: "push-up",
    name: "Flexão de Braço",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos", "core"],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Posicione-se em prancha alta",
      "Mãos na largura dos ombros",
      "Mantenha corpo em linha reta",
      "Desça o corpo até quase tocar o chão",
      "Empurre de volta à posição inicial",
    ],
    tips: [
      "Mantenha o core contraído",
      "Não deixe o quadril cair",
      "Controle ambas as fases",
      "Mantenha cotovelos a 45 graus",
    ],
    commonMistakes: [
      "Arquear as costas",
      "Deixar o quadril cair",
      "Não descer o suficiente",
      "Cotovelos muito abertos",
    ],
    benefits: [
      "Exercício composto completo",
      "Desenvolve peito, ombros e tríceps",
      "Fortalece o core",
      "Não requer equipamento",
    ],
    scientificEvidence:
      "Exercício composto que ativa peitoral, deltoide anterior e tríceps, além do core para estabilização.",
  },
  {
    id: "incline-bench-press",
    name: "Supino Inclinado",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Banco inclinado", "Barra", "Anilhas"],
    instructions: [
      "Ajuste o banco a 30-45 graus",
      "Deite-se mantendo pés no chão",
      "Pegue a barra com pegada ligeiramente mais larga que ombros",
      "Desça controladamente até tocar o peito superior",
      "Empurre de volta à posição inicial",
    ],
    tips: [
      "Angulação de 30-45 graus é ideal",
      "Mantenha omoplatas retraídas",
      "Empurre através da parte superior do peito",
      "Controle a fase excêntrica",
    ],
    commonMistakes: [
      "Angulação muito alta (ativa mais ombros)",
      "Bater a barra no peito",
      "Tirar glúteos do banco",
      "Não usar amplitude completa",
    ],
    benefits: [
      "Desenvolvimento do peitoral superior",
      "Aumenta largura do tórax",
      "Melhora força de empurrar",
      "Balanceamento com peito inferior",
    ],
    scientificEvidence:
      "EMG mostra maior ativação da cabeça clavicular do peitoral comparado ao supino reto.",
  },
  {
    id: "cable-fly",
    name: "Crucifixo no Cabo",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros"],
    difficulty: "iniciante",
    equipment: ["Cabos", "Polias"],
    instructions: [
      "Ajuste as polias na altura dos ombros",
      "Fique no centro segurando os cabos",
      "Brace o core e leve os braços para frente",
      "Junte as mãos à frente do peito",
      "Retorne controladamente sentindo alongamento",
    ],
    tips: [
      "Mantenha leve flexão nos cotovelos",
      "Foque no peitoral, não nos ombros",
      "Controle o alongamento na volta",
      "Não balance o corpo",
    ],
    commonMistakes: [
      "Estender demais os cotovelos",
      "Usar peso excessivo",
      "Balancear o corpo",
      "Não sentir alongamento",
    ],
    benefits: [
      "Isolamento efetivo do peitoral",
      "Alongamento e contração completos",
      "Desenvolvimento da largura do peito",
      "Menor estresse articular",
    ],
    scientificEvidence:
      "Exercício de isolamento que proporciona alongamento e contração máximos do peitoral.",
  },
  // ============================================
  // EXERCÍCIOS ADICIONAIS - PEITO
  // ============================================
  {
    id: "bench-press-incline",
    name: "Supino Inclinado",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Banco Inclinado", "Barra", "Anilhas"],
    instructions: [
      "Ajuste o banco em 30-45 graus de inclinação",
      "Deite-se com os pés firmes no chão",
      "Pegue a barra com pegada ligeiramente mais larga que os ombros",
      "Desça a barra até o peito superior",
      "Empurre a barra de volta à posição inicial",
    ],
    tips: [
      "A inclinação de 30-45 graus ativa mais a porção superior do peitoral",
      "Mantenha os omoplatas retraídos",
      "Não arquear excessivamente as costas",
      "Controle a descida da barra",
    ],
    commonMistakes: [
      "Inclinação muito alta (trabalha mais ombros que peito)",
      "Não usar amplitude completa",
      "Pés no banco (reduz estabilidade)",
      "Barra muito alta no peito",
    ],
    benefits: [
      "Desenvolvimento da porção superior do peitoral",
      "Melhora da definição do peito",
      "Aumento de força funcional",
      "Estética superior do tórax",
    ],
    scientificEvidence:
      "EMG mostra que inclinações de 30-45 graus maximizam a ativação da porção clavicular do peitoral maior.",
  },
  {
    id: "bench-press-decline",
    name: "Supino Declinado",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Banco Declinado", "Barra", "Anilhas"],
    instructions: [
      "Ajuste o banco em declive de 15-30 graus",
      "Prenda os pés nas alças de segurança",
      "Pegue a barra com pegada ligeiramente mais larga que os ombros",
      "Desça a barra até o peito inferior",
      "Empurre a barra de volta à posição inicial",
    ],
    tips: [
      "A declinação trabalha mais a porção inferior do peitoral",
      "Mantenha os pés sempre presos",
      "Controle total do movimento",
      "Não use peso excessivo",
    ],
    commonMistakes: [
      "Declinação muito acentuada (perigoso)",
      "Pés soltos (risco de queda)",
      "Barra muito baixa no peito",
      "Não usar segurança",
    ],
    benefits: [
      "Desenvolvimento da porção inferior do peitoral",
      "Maior ativação da porção esternocostal",
      "Força funcional para movimentos de empurrar para baixo",
    ],
    scientificEvidence:
      "Estudos mostram maior ativação da porção inferior do peitoral em declinações de 15-30 graus.",
  },
  {
    id: "dumbbell-bench-press",
    name: "Supino com Halteres",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Halteres", "Banco"],
    instructions: [
      "Deite-se no banco segurando halteres",
      "Posicione os halteres ao lado do peito com cotovelos a 45 graus",
      "Empurre os halteres para cima até quase tocar",
      "Desça controladamente até alongamento completo",
      "Mantenha os halteres alinhados",
    ],
    tips: [
      "Maior amplitude de movimento que com barra",
      "Permite movimento mais natural dos ombros",
      "Trabalha estabilizadores",
      "Pode corrigir assimetrias",
    ],
    commonMistakes: [
      "Halteres desalinhados",
      "Amplitude incompleta",
      "Peso excessivo comprometendo forma",
      "Não controlar a descida",
    ],
    benefits: [
      "Maior amplitude de movimento",
      "Desenvolvimento de estabilidade",
      "Correção de assimetrias",
      "Menor estresse nos ombros",
    ],
    scientificEvidence:
      "Halteres permitem maior amplitude e ativação do peitoral comparado à barra, além de maior ativação dos estabilizadores.",
  },
  {
    id: "dumbbell-fly",
    name: "Crucifixo com Halteres",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros"],
    difficulty: "iniciante",
    equipment: ["Halteres", "Banco"],
    instructions: [
      "Deite-se no banco segurando halteres",
      "Braços ligeiramente flexionados",
      "Abra os braços em arco até sentir alongamento",
      "Feche os braços como se estivesse abraçando",
      "Mantenha leve flexão nos cotovelos",
    ],
    tips: [
      "Foque no alongamento e contração",
      "Não estenda completamente os cotovelos",
      "Movimento controlado e lento",
      "Sinta o peitoral trabalhando",
    ],
    commonMistakes: [
      "Estender demais os cotovelos",
      "Peso excessivo",
      "Movimento muito rápido",
      "Não sentir alongamento",
    ],
    benefits: [
      "Isolamento efetivo do peitoral",
      "Alongamento máximo",
      "Desenvolvimento da largura do peito",
      "Baixo estresse articular",
    ],
    scientificEvidence:
      "Exercício de isolamento que maximiza o alongamento do peitoral, crucial para desenvolvimento muscular.",
  },
  {
    id: "push-up-incline",
    name: "Flexão Inclinada",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Posicione as mãos em uma superfície elevada (banco, parede)",
      "Mantenha corpo alinhado",
      "Desça o corpo até quase tocar a superfície",
      "Empurre de volta à posição inicial",
      "Quanto mais alta a superfície, mais fácil",
    ],
    tips: [
      "Ideal para iniciantes",
      "Progressão para flexão normal",
      "Mantenha forma correta",
      "Aumente dificuldade diminuindo altura",
    ],
    commonMistakes: [
      "Superfície muito alta (muito fácil)",
      "Não usar amplitude completa",
      "Forma incorreta",
    ],
    benefits: [
      "Progressão para flexão normal",
      "Desenvolvimento de força",
      "Acessível para iniciantes",
    ],
  },
  {
    id: "push-up-decline",
    name: "Flexão Declinada",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos", "core"],
    difficulty: "intermediario",
    equipment: [],
    instructions: [
      "Posicione os pés em uma superfície elevada",
      "Mãos no chão na largura dos ombros",
      "Mantenha corpo alinhado",
      "Desça até quase tocar o chão",
      "Empurre de volta",
    ],
    tips: [
      "Trabalha mais a porção superior do peito",
      "Mais difícil que flexão normal",
      "Mantenha core forte",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Elevação muito alta (perigoso)",
      "Forma incorreta",
      "Não controlar descida",
    ],
    benefits: [
      "Maior dificuldade",
      "Trabalha porção superior do peito",
      "Desenvolvimento de força",
    ],
  },
  {
    id: "pec-deck",
    name: "Voador (Pec Deck)",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros"],
    difficulty: "iniciante",
    equipment: ["Máquina"],
    instructions: [
      "Sente-se na máquina com costas apoiadas",
      "Ajuste altura dos braços",
      "Empurre os braços juntos até se tocarem",
      "Retorne controladamente sentindo alongamento",
      "Mantenha costas apoiadas",
    ],
    tips: [
      "Máquina segura para iniciantes",
      "Foque no alongamento e contração",
      "Não use peso excessivo",
      "Controle a fase excêntrica",
    ],
    commonMistakes: [
      "Peso excessivo",
      "Não usar amplitude completa",
      "Tirar costas do apoio",
      "Movimento muito rápido",
    ],
    benefits: [
      "Seguro para iniciantes",
      "Isolamento do peitoral",
      "Menor risco de lesão",
      "Boa para reabilitação",
    ],
  },
  {
    id: "cable-crossover",
    name: "Crossover no Cabo",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros"],
    difficulty: "intermediario",
    equipment: ["Cabos", "Polias"],
    instructions: [
      "Ajuste polias acima da altura dos ombros",
      "Fique no centro segurando os cabos",
      "Dê um passo à frente",
      "Traga os braços juntos cruzando à frente",
      "Retorne controladamente",
    ],
    tips: [
      "Pé à frente aumenta estabilidade",
      "Foque no peitoral, não nos ombros",
      "Controle o alongamento",
      "Não balance o corpo",
    ],
    commonMistakes: [
      "Balancear o corpo",
      "Usar ombros demais",
      "Não sentir alongamento",
      "Peso excessivo",
    ],
    benefits: [
      "Alongamento e contração máximos",
      "Desenvolvimento da largura do peito",
      "Tensão constante (cabos)",
      "Versatilidade de ângulos",
    ],
    scientificEvidence:
      "Crossover proporciona tensão constante e alongamento máximo do peitoral, ideal para hipertrofia.",
  },
  // ============================================
  // EXERCÍCIOS ADICIONAIS - COSTAS
  // ============================================
  {
    id: "bent-over-row",
    name: "Remada Curvada",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "ombros"],
    difficulty: "intermediario",
    equipment: ["Barra", "Anilhas"],
    instructions: [
      "Segure a barra com pegada pronada",
      "Flexione quadris mantendo costas retas",
      "Puxe a barra até o abdômen inferior",
      "Retraia as escápulas na contração",
      "Desça controladamente",
    ],
    tips: [
      "Mantenha costas sempre retas",
      "Puxe com as costas, não com os braços",
      "Retraia escápulas no topo",
      "Controle a descida",
    ],
    commonMistakes: [
      "Arredondar as costas",
      "Puxar com os braços",
      "Não retrair escápulas",
      "Peso excessivo",
    ],
    benefits: [
      "Desenvolvimento completo das costas",
      "Fortalecimento da cadeia posterior",
      "Melhora de postura",
      "Exercício composto",
    ],
    scientificEvidence:
      "Remada curvada é um dos exercícios mais efetivos para desenvolvimento do grande dorsal e romboides.",
  },
  {
    id: "seated-row",
    name: "Remada Sentada",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "ombros"],
    difficulty: "iniciante",
    equipment: ["Máquina", "Cabo"],
    instructions: [
      "Sente-se com pés apoiados",
      "Segure o cabo com pegada neutra",
      "Puxe até o abdômen",
      "Retraia escápulas",
      "Retorne controladamente",
    ],
    tips: [
      "Máquina segura para iniciantes",
      "Foque em retrair escápulas",
      "Não balance o corpo",
      "Controle a fase excêntrica",
    ],
    commonMistakes: [
      "Balancear o corpo",
      "Puxar com os braços",
      "Não retrair escápulas",
      "Puxar muito para trás",
    ],
    benefits: [
      "Seguro para iniciantes",
      "Isolamento das costas",
      "Menor risco de lesão",
      "Boa para reabilitação",
    ],
  },
  {
    id: "lat-pulldown",
    name: "Puxada Frontal",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "ombros"],
    difficulty: "iniciante",
    equipment: ["Máquina", "Cabo"],
    instructions: [
      "Sente-se na máquina com joelhos presos",
      "Segure a barra com pegada pronada",
      "Puxe a barra até o peito superior",
      "Retraia escápulas",
      "Retorne controladamente",
    ],
    tips: [
      "Ideal para quem não consegue fazer barra fixa",
      "Foque em puxar com as costas",
      "Não balance o corpo",
      "Controle a descida",
    ],
    commonMistakes: [
      "Puxar com os braços",
      "Balancear o corpo",
      "Não retrair escápulas",
      "Barra muito alta",
    ],
    benefits: [
      "Alternativa à barra fixa",
      "Desenvolvimento do grande dorsal",
      "Seguro para iniciantes",
      "Progressão para barra fixa",
    ],
    scientificEvidence:
      "Puxada frontal é uma excelente alternativa à barra fixa, com ativação similar do grande dorsal.",
  },
  {
    id: "t-bar-row",
    name: "Remada T",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "ombros"],
    difficulty: "intermediario",
    equipment: ["Barra T", "Anilhas"],
    instructions: [
      "Monte a barra T com peso",
      "Fique sobre a barra com pés apoiados",
      "Puxe a barra até o peito",
      "Retraia escápulas",
      "Desça controladamente",
    ],
    tips: [
      "Permite maior carga",
      "Movimento mais natural",
      "Foque nas costas",
      "Mantenha core ativo",
    ],
    commonMistakes: [
      "Arredondar costas",
      "Puxar com braços",
      "Não retrair escápulas",
      "Peso excessivo",
    ],
    benefits: [
      "Permite maior carga",
      "Desenvolvimento de força",
      "Movimento natural",
      "Exercício composto",
    ],
  },
  {
    id: "one-arm-row",
    name: "Remada Unilateral",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "ombros"],
    difficulty: "intermediario",
    equipment: ["Halter", "Banco"],
    instructions: [
      "Apoie joelho e mão no banco",
      "Segure halter com braço livre",
      "Puxe o halter até o quadril",
      "Retraia escápula",
      "Desça controladamente",
    ],
    tips: [
      "Corrige assimetrias",
      "Maior amplitude de movimento",
      "Foque em retrair escápula",
      "Mantenha costas retas",
    ],
    commonMistakes: [
      "Arredondar costas",
      "Rotacionar tronco",
      "Não retrair escápula",
      "Puxar com braço",
    ],
    benefits: [
      "Correção de assimetrias",
      "Maior amplitude",
      "Desenvolvimento unilateral",
      "Estabilização do core",
    ],
  },
  {
    id: "pullover",
    name: "Pullover",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["peito", "ombros"],
    difficulty: "intermediario",
    equipment: ["Halter", "Banco"],
    instructions: [
      "Deite-se no banco segurando halter",
      "Braços estendidos acima do peito",
      "Desça o halter atrás da cabeça",
      "Sinta alongamento nas costas",
      "Retorne à posição inicial",
    ],
    tips: [
      "Foque no alongamento",
      "Mantenha leve flexão nos cotovelos",
      "Controle o movimento",
      "Sinta as costas trabalhando",
    ],
    commonMistakes: [
      "Estender demais cotovelos",
      "Não sentir alongamento",
      "Peso excessivo",
      "Movimento muito rápido",
    ],
    benefits: [
      "Alongamento máximo das costas",
      "Desenvolvimento de serrátil",
      "Expansão da caixa torácica",
      "Exercício único",
    ],
  },
  // ============================================
  // EXERCÍCIOS ADICIONAIS - PERNAS
  // ============================================
  {
    id: "leg-press",
    name: "Leg Press",
    primaryMuscles: ["pernas", "gluteos"],
    secondaryMuscles: ["core"],
    difficulty: "iniciante",
    equipment: ["Máquina"],
    instructions: [
      "Sente-se na máquina com pés na plataforma",
      "Pés na largura dos ombros",
      "Desça a plataforma flexionando joelhos",
      "Desça até 90 graus",
      "Empurre de volta",
    ],
    tips: [
      "Máquina segura para iniciantes",
      "Pés na largura dos ombros",
      "Não trave os joelhos",
      "Controle a descida",
    ],
    commonMistakes: [
      "Amplitude incompleta",
      "Joelhos colapsando",
      "Travar joelhos",
      "Peso excessivo",
    ],
    benefits: [
      "Seguro para iniciantes",
      "Permite maior carga",
      "Menor estresse na coluna",
      "Boa para reabilitação",
    ],
  },
  {
    id: "leg-curl-seated",
    name: "Cadeira Flexora",
    primaryMuscles: ["pernas"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Máquina"],
    instructions: [
      "Sente-se na máquina com pernas presas",
      "Flexione joelhos trazendo calcanhares ao glúteos",
      "Contraia isquiotibiais",
      "Retorne controladamente",
      "Mantenha costas apoiadas",
    ],
    tips: [
      "Isolamento dos isquiotibiais",
      "Controle a fase excêntrica",
      "Não use impulso",
      "Sinta os músculos trabalhando",
    ],
    commonMistakes: [
      "Usar impulso",
      "Não controlar descida",
      "Amplitude incompleta",
      "Peso excessivo",
    ],
    benefits: [
      "Isolamento de isquiotibiais",
      "Equilíbrio muscular",
      "Prevenção de lesões",
      "Seguro para iniciantes",
    ],
  },
  {
    id: "leg-extension",
    name: "Cadeira Extensora",
    primaryMuscles: ["pernas"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Máquina"],
    instructions: [
      "Sente-se na máquina com pernas presas",
      "Estenda joelhos completamente",
      "Contraia quadríceps",
      "Retorne controladamente",
      "Mantenha costas apoiadas",
    ],
    tips: [
      "Isolamento do quadríceps",
      "Controle a fase excêntrica",
      "Não trave joelhos",
      "Sinta o quadríceps",
    ],
    commonMistakes: [
      "Travar joelhos",
      "Não controlar descida",
      "Peso excessivo",
      "Amplitude incompleta",
    ],
    benefits: [
      "Isolamento do quadríceps",
      "Desenvolvimento de força",
      "Boa para reabilitação",
      "Seguro para iniciantes",
    ],
  },
  {
    id: "bulgarian-split-squat",
    name: "Agachamento Búlgaro",
    primaryMuscles: ["pernas", "gluteos"],
    secondaryMuscles: ["core"],
    difficulty: "intermediario",
    equipment: ["Halteres"],
    instructions: [
      "Pé traseiro apoiado em banco",
      "Pé dianteiro à frente",
      "Desça flexionando joelho dianteiro",
      "Desça até coxa paralela ao chão",
      "Empurre de volta",
    ],
    tips: [
      "Trabalha pernas unilateralmente",
      "Corrige assimetrias",
      "Mantenha tronco ereto",
      "Foque no pé da frente",
    ],
    commonMistakes: [
      "Joelho passando dos dedos",
      "Tronco inclinando",
      "Não usar amplitude completa",
      "Peso excessivo",
    ],
    benefits: [
      "Trabalho unilateral",
      "Correção de assimetrias",
      "Desenvolvimento de força",
      "Estabilização",
    ],
  },
  {
    id: "lunge",
    name: "Avanço (Lunge)",
    primaryMuscles: ["pernas", "gluteos"],
    secondaryMuscles: ["core"],
    difficulty: "intermediario",
    equipment: ["Halteres"],
    instructions: [
      "Dê um passo à frente",
      "Desça flexionando ambos joelhos",
      "Joelho traseiro quase toca o chão",
      "Joelho dianteiro a 90 graus",
      "Empurre de volta",
    ],
    tips: [
      "Trabalho funcional",
      "Mantenha tronco ereto",
      "Passo longo para mais glúteos",
      "Passo curto para mais quadríceps",
    ],
    commonMistakes: [
      "Joelho passando dos dedos",
      "Tronco inclinando",
      "Não usar amplitude completa",
      "Joelhos colapsando",
    ],
    benefits: [
      "Exercício funcional",
      "Desenvolvimento de força",
      "Melhora de equilíbrio",
      "Trabalho unilateral",
    ],
  },
  {
    id: "calf-raise",
    name: "Elevação de Panturrilha",
    primaryMuscles: ["pernas"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Máquina"],
    instructions: [
      "Posicione ombros sob a máquina",
      "Pés na plataforma",
      "Elevação máxima na ponta dos pés",
      "Contraia panturrilhas",
      "Desça controladamente",
    ],
    tips: [
      "Amplitude completa",
      "Controle a fase excêntrica",
      "Pode fazer em pé ou sentado",
      "Sinta as panturrilhas",
    ],
    commonMistakes: [
      "Amplitude incompleta",
      "Não controlar descida",
      "Peso excessivo",
      "Balancear",
    ],
    benefits: [
      "Desenvolvimento de panturrilhas",
      "Melhora de estética",
      "Força funcional",
      "Equilíbrio",
    ],
  },
  // ============================================
  // EXERCÍCIOS ADICIONAIS - OMBROS
  // ============================================
  {
    id: "shoulder-press",
    name: "Desenvolvimento",
    primaryMuscles: ["ombros"],
    secondaryMuscles: ["bracos", "core"],
    difficulty: "intermediario",
    equipment: ["Halteres", "Barra"],
    instructions: [
      "Segure halteres na altura dos ombros",
      "Palmas para frente",
      "Empurre para cima até extensão completa",
      "Não trave os cotovelos",
      "Desça controladamente",
    ],
    tips: [
      "Pode fazer sentado ou em pé",
      "Sentado é mais seguro",
      "Mantenha core ativo",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Arquear excessivamente as costas",
      "Não usar amplitude completa",
      "Travar cotovelos",
      "Peso excessivo",
    ],
    benefits: [
      "Desenvolvimento completo dos ombros",
      "Força funcional",
      "Exercício composto",
      "Transferência para movimentos diários",
    ],
  },
  {
    id: "lateral-raise",
    name: "Elevação Lateral",
    primaryMuscles: ["ombros"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Halteres"],
    instructions: [
      "Segure halteres ao lado do corpo",
      "Braços ligeiramente flexionados",
      "Eleve até altura dos ombros",
      "Contraia deltoides",
      "Desça controladamente",
    ],
    tips: [
      "Isolamento do deltoide médio",
      "Não balance o corpo",
      "Controle o movimento",
      "Sinta os ombros trabalhando",
    ],
    commonMistakes: [
      "Balancear o corpo",
      "Peso excessivo",
      "Elevar muito alto",
      "Usar impulso",
    ],
    benefits: [
      "Desenvolvimento da largura dos ombros",
      "Isolamento efetivo",
      "Estética",
      "Força funcional",
    ],
  },
  {
    id: "front-raise",
    name: "Elevação Frontal",
    primaryMuscles: ["ombros"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Halteres"],
    instructions: [
      "Segure halteres à frente do corpo",
      "Eleve até altura dos ombros",
      "Contraia deltoide anterior",
      "Desça controladamente",
      "Mantenha braços estendidos",
    ],
    tips: [
      "Isolamento do deltoide anterior",
      "Controle o movimento",
      "Não balance",
      "Sinta os ombros",
    ],
    commonMistakes: [
      "Balancear",
      "Peso excessivo",
      "Elevar muito alto",
      "Usar impulso",
    ],
    benefits: [
      "Desenvolvimento do deltoide anterior",
      "Isolamento",
      "Estética",
    ],
  },
  {
    id: "rear-delt-fly",
    name: "Voador Invertido",
    primaryMuscles: ["ombros"],
    secondaryMuscles: ["costas"],
    difficulty: "iniciante",
    equipment: ["Halteres"],
    instructions: [
      "Flexione quadris mantendo costas retas",
      "Braços ligeiramente flexionados",
      "Abra os braços até altura dos ombros",
      "Contraia deltoides posteriores",
      "Retorne controladamente",
    ],
    tips: [
      "Crucial para saúde dos ombros",
      "Foque nos deltoides posteriores",
      "Mantenha costas retas",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Arredondar costas",
      "Peso excessivo",
      "Não sentir deltoides posteriores",
      "Movimento muito rápido",
    ],
    benefits: [
      "Desenvolvimento de deltoides posteriores",
      "Saúde dos ombros",
      "Correção de postura",
      "Prevenção de lesões",
    ],
    scientificEvidence:
      "Deltoides posteriores são frequentemente negligenciados, causando desequilíbrios e problemas nos ombros.",
  },
  {
    id: "arnold-press",
    name: "Desenvolvimento Arnold",
    primaryMuscles: ["ombros"],
    secondaryMuscles: ["bracos"],
    difficulty: "intermediario",
    equipment: ["Halteres"],
    instructions: [
      "Comece com halteres na frente, palmas para você",
      "Rotacione enquanto empurra para cima",
      "Termine com palmas para frente",
      "Inverta o movimento na descida",
      "Controle todo o movimento",
    ],
    tips: [
      "Trabalha todas as porções do deltoide",
      "Movimento complexo",
      "Controle total necessário",
      "Não use peso excessivo",
    ],
    commonMistakes: [
      "Peso excessivo",
      "Movimento muito rápido",
      "Não controlar rotação",
      "Forma incorreta",
    ],
    benefits: [
      "Desenvolvimento completo dos ombros",
      "Movimento único",
      "Ativação de todas as porções",
    ],
  },
  // ============================================
  // EXERCÍCIOS ADICIONAIS - BRAÇOS
  // ============================================
  {
    id: "bicep-curl",
    name: "Rosca Direta",
    primaryMuscles: ["bracos"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Halteres"],
    instructions: [
      "Segure halteres ao lado do corpo",
      "Flexione cotovelos trazendo halteres aos ombros",
      "Contraia bíceps",
      "Desça controladamente",
      "Mantenha cotovelos fixos",
    ],
    tips: [
      "Isolamento de bíceps",
      "Mantenha cotovelos fixos",
      "Controle a fase excêntrica",
      "Não balance o corpo",
    ],
    commonMistakes: [
      "Balancear o corpo",
      "Mover cotovelos",
      "Peso excessivo",
      "Não controlar descida",
    ],
    benefits: ["Desenvolvimento de bíceps", "Isolamento efetivo", "Estética"],
  },
  {
    id: "hammer-curl",
    name: "Rosca Martelo",
    primaryMuscles: ["bracos"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Halteres"],
    instructions: [
      "Segure halteres com pegada neutra",
      "Flexione cotovelos",
      "Contraia bíceps e antebraços",
      "Desça controladamente",
      "Mantenha pegada neutra",
    ],
    tips: [
      "Trabalha bíceps e antebraços",
      "Pegada neutra",
      "Controle o movimento",
      "Sinta ambos trabalhando",
    ],
    commonMistakes: [
      "Balancear",
      "Mover cotovelos",
      "Peso excessivo",
      "Não controlar",
    ],
    benefits: [
      "Desenvolvimento de bíceps e antebraços",
      "Espessura do braço",
      "Força de pegada",
    ],
  },
  {
    id: "tricep-dip",
    name: "Mergulho (Tríceps)",
    primaryMuscles: ["bracos"],
    secondaryMuscles: ["ombros", "peito"],
    difficulty: "intermediario",
    equipment: ["Barras Paralelas"],
    instructions: [
      "Segure barras paralelas",
      "Mantenha corpo ereto",
      "Desça flexionando cotovelos",
      "Desça até 90 graus",
      "Empurre de volta",
    ],
    tips: [
      "Corpo ereto trabalha mais tríceps",
      "Não descer demais",
      "Controle o movimento",
      "Mantenha core ativo",
    ],
    commonMistakes: [
      "Descer demais",
      "Balancear",
      "Não controlar",
      "Forma incorreta",
    ],
    benefits: [
      "Desenvolvimento de tríceps",
      "Exercício composto",
      "Força funcional",
    ],
  },
  {
    id: "tricep-kickback",
    name: "Tríceps Coice",
    primaryMuscles: ["bracos"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Halter"],
    instructions: [
      "Apoie joelho e mão no banco",
      "Segure halter com braço livre",
      "Cotovelo a 90 graus",
      "Estenda braço para trás",
      "Contraia tríceps",
    ],
    tips: [
      "Isolamento de tríceps",
      "Mantenha cotovelo fixo",
      "Controle o movimento",
      "Sinta o tríceps",
    ],
    commonMistakes: [
      "Mover cotovelo",
      "Peso excessivo",
      "Não controlar",
      "Não sentir tríceps",
    ],
    benefits: ["Isolamento de tríceps", "Desenvolvimento", "Estética"],
  },
  {
    id: "close-grip-bench",
    name: "Supino Fechado",
    primaryMuscles: ["bracos"],
    secondaryMuscles: ["peito", "ombros"],
    difficulty: "intermediario",
    equipment: ["Barra", "Banco", "Anilhas"],
    instructions: [
      "Deite-se no banco",
      "Pegada fechada (mãos na largura dos ombros)",
      "Desça barra até o peito",
      "Empurre focando em tríceps",
      "Mantenha cotovelos junto ao corpo",
    ],
    tips: [
      "Excelente para tríceps",
      "Cotovelos junto ao corpo",
      "Foque em tríceps",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Abrir cotovelos",
      "Pegada muito fechada",
      "Não focar em tríceps",
      "Peso excessivo",
    ],
    benefits: ["Desenvolvimento de tríceps", "Exercício composto", "Força"],
  },
  {
    id: "preacher-curl",
    name: "Rosca Scott",
    primaryMuscles: ["bracos"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: ["Máquina", "Barra"],
    instructions: [
      "Apoie braços no banco Scott",
      "Segure barra",
      "Flexione cotovelos",
      "Contraia bíceps",
      "Desça controladamente",
    ],
    tips: [
      "Isolamento máximo de bíceps",
      "Controle a fase excêntrica",
      "Sinta os bíceps",
      "Não use impulso",
    ],
    commonMistakes: [
      "Usar impulso",
      "Peso excessivo",
      "Não controlar",
      "Amplitude incompleta",
    ],
    benefits: ["Isolamento máximo", "Desenvolvimento de bíceps", "Estética"],
  },
  // ============================================
  // EXERCÍCIOS ADICIONAIS - CORE
  // ============================================
  {
    id: "plank",
    name: "Prancha",
    primaryMuscles: ["core"],
    secondaryMuscles: ["ombros"],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Posicione-se em prancha",
      "Apoie antebraços e pés",
      "Mantenha corpo alinhado",
      "Contraia core",
      "Mantenha posição",
    ],
    tips: [
      "Exercício isométrico",
      "Mantenha corpo alinhado",
      "Respire normalmente",
      "Contraia core",
    ],
    commonMistakes: [
      "Arquear ou afundar costas",
      "Cabeça para baixo",
      "Não contrair core",
      "Segurar respiração",
    ],
    benefits: [
      "Fortalecimento de core",
      "Estabilidade",
      "Sem equipamento",
      "Prevenção de lesões",
    ],
    scientificEvidence:
      "Prancha é um dos exercícios mais efetivos para desenvolvimento de força isométrica do core.",
  },
  {
    id: "crunch",
    name: "Abdominal",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Deite-se com joelhos flexionados",
      "Mãos atrás da cabeça",
      "Contraia abdômen",
      "Eleve tronco parcialmente",
      "Retorne controladamente",
    ],
    tips: [
      "Foque em contrair abdômen",
      "Não puxar pescoço",
      "Movimento curto",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Puxar pescoço",
      "Movimento muito longo",
      "Usar impulso",
      "Não contrair abdômen",
    ],
    benefits: ["Desenvolvimento de abdômen", "Sem equipamento", "Acessível"],
  },
  {
    id: "mountain-climber",
    name: "Escalador",
    primaryMuscles: ["core"],
    secondaryMuscles: ["pernas", "ombros"],
    difficulty: "intermediario",
    equipment: [],
    instructions: [
      "Posicione-se em prancha",
      "Alternne pernas rapidamente",
      "Traga joelho ao peito",
      "Mantenha core contraído",
      "Ritmo constante",
    ],
    tips: [
      "Exercício dinâmico",
      "Mantenha core ativo",
      "Ritmo constante",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Arquear costas",
      "Ritmo irregular",
      "Não contrair core",
      "Movimento muito rápido",
    ],
    benefits: ["Cardio e core", "Queima calórica", "Força funcional"],
  },
  {
    id: "dead-bug",
    name: "Inseto Morto",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Deite-se de costas",
      "Braços e pernas no ar",
      "Estenda braço e perna opostos",
      "Retorne à posição inicial",
      "Alternne lados",
    ],
    tips: [
      "Excelente para iniciantes",
      "Mantenha costas no chão",
      "Controle o movimento",
      "Foque em estabilidade",
    ],
    commonMistakes: [
      "Arquear costas",
      "Movimento muito rápido",
      "Não controlar",
      "Perder estabilidade",
    ],
    benefits: [
      "Estabilidade do core",
      "Seguro para iniciantes",
      "Prevenção de lesões",
    ],
  },
  {
    id: "hanging-leg-raise",
    name: "Elevação de Pernas na Barra",
    primaryMuscles: ["core"],
    secondaryMuscles: ["pernas"],
    difficulty: "avancado",
    equipment: ["Barra Fixa"],
    instructions: [
      "Segure a barra",
      "Mantenha corpo estável",
      "Eleve pernas até altura dos quadris",
      "Contraia abdômen",
      "Desça controladamente",
    ],
    tips: [
      "Exercício avançado",
      "Mantenha corpo estável",
      "Foque em abdômen",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Balancear",
      "Usar impulso",
      "Não contrair abdômen",
      "Forma incorreta",
    ],
    benefits: [
      "Desenvolvimento avançado de core",
      "Força funcional",
      "Estética",
    ],
  },
  // ============================================
  // EXERCÍCIOS ADICIONAIS - CARDIO E FUNCIONAL
  // ============================================
  {
    id: "burpee",
    name: "Burpee",
    primaryMuscles: ["cardio", "funcional"],
    secondaryMuscles: ["pernas", "core", "ombros"],
    difficulty: "avancado",
    equipment: [],
    instructions: [
      "Comece em pé",
      "Desça em agachamento",
      "Salte para prancha",
      "Faça uma flexão",
      "Volte e salte",
    ],
    tips: [
      "Exercício completo",
      "Alta intensidade",
      "Controle a respiração",
      "Mantenha forma correta",
    ],
    commonMistakes: [
      "Forma incorreta",
      "Não fazer flexão completa",
      "Ritmo irregular",
      "Não controlar movimento",
    ],
    benefits: [
      "Alto gasto calórico",
      "Exercício completo",
      "Melhora de condicionamento",
      "Força funcional",
    ],
  },
  {
    id: "jumping-jack",
    name: "Polichinelo",
    primaryMuscles: ["cardio"],
    secondaryMuscles: ["pernas", "ombros"],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Fique em pé",
      "Salte abrindo pernas e braços",
      "Volte à posição inicial",
      "Mantenha ritmo constante",
    ],
    tips: [
      "Aquecimento excelente",
      "Ritmo constante",
      "Controle aterrissagem",
      "Mantenha core ativo",
    ],
    commonMistakes: [
      "Aterrissagem dura",
      "Ritmo irregular",
      "Não controlar movimento",
    ],
    benefits: ["Aquecimento", "Cardio leve", "Coordenação", "Acessível"],
  },
  {
    id: "high-knee",
    name: "Joelho Alto",
    primaryMuscles: ["cardio"],
    secondaryMuscles: ["pernas", "core"],
    difficulty: "iniciante",
    equipment: [],
    instructions: [
      "Fique em pé",
      "Eleve joelhos alternadamente",
      "Ritmo rápido",
      "Mantenha core ativo",
    ],
    tips: [
      "Aquecimento",
      "Ritmo constante",
      "Mantenha postura",
      "Controle movimento",
    ],
    commonMistakes: [
      "Ritmo irregular",
      "Postura incorreta",
      "Não elevar joelhos",
    ],
    benefits: ["Aquecimento", "Cardio", "Coordenação"],
  },
  {
    id: "box-jump",
    name: "Salto no Caixote",
    primaryMuscles: ["funcional"],
    secondaryMuscles: ["pernas", "gluteos", "core"],
    difficulty: "avancado",
    equipment: ["Caixote"],
    instructions: [
      "Fique frente ao caixote",
      "Salte sobre o caixote",
      "Aterrisse com ambos pés",
      "Desça controladamente",
    ],
    tips: [
      "Exercício avançado",
      "Comece com altura baixa",
      "Controle aterrissagem",
      "Mantenha core ativo",
    ],
    commonMistakes: [
      "Altura muito alta",
      "Aterrissagem dura",
      "Não controlar",
      "Forma incorreta",
    ],
    benefits: ["Potência", "Força funcional", "Coordenação", "Condicionamento"],
  },
  {
    id: "kettlebell-swing",
    name: "Balancinho com Kettlebell",
    primaryMuscles: ["funcional"],
    secondaryMuscles: ["gluteos", "pernas", "core", "ombros"],
    difficulty: "intermediario",
    equipment: ["Kettlebell"],
    instructions: [
      "Segure kettlebell com ambas mãos",
      "Flexione quadris",
      "Balance kettlebell até altura dos ombros",
      "Use impulso dos quadris",
      "Controle descida",
    ],
    tips: [
      "Exercício funcional completo",
      "Foque em quadris, não braços",
      "Controle o movimento",
      "Mantenha core ativo",
    ],
    commonMistakes: [
      "Usar braços demais",
      "Não usar quadris",
      "Peso excessivo",
      "Forma incorreta",
    ],
    benefits: [
      "Exercício funcional completo",
      "Potência",
      "Condicionamento",
      "Força posterior",
    ],
    scientificEvidence:
      "Kettlebell swing é um dos exercícios mais efetivos para desenvolvimento de potência e condicionamento.",
  },
  {
    id: "battle-rope",
    name: "Corda de Batalha",
    primaryMuscles: ["cardio", "funcional"],
    secondaryMuscles: ["ombros", "core", "bracos"],
    difficulty: "intermediario",
    equipment: ["Corda de Batalha"],
    instructions: [
      "Segure corda com ambas mãos",
      "Crie ondas alternadas",
      "Mantenha ritmo constante",
      "Use corpo todo",
    ],
    tips: [
      "Alta intensidade",
      "Ritmo constante",
      "Use corpo todo",
      "Controle respiração",
    ],
    commonMistakes: [
      "Usar apenas braços",
      "Ritmo irregular",
      "Não usar core",
      "Fadiga rápida",
    ],
    benefits: [
      "Alto gasto calórico",
      "Condicionamento",
      "Força funcional",
      "Exercício completo",
    ],
  },
  {
    id: "farmer-walk",
    name: "Caminhada do Fazendeiro",
    primaryMuscles: ["funcional"],
    secondaryMuscles: ["core", "ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Halteres", "Kettlebells"],
    instructions: [
      "Segure peso em cada mão",
      "Mantenha postura ereta",
      "Caminhe distância determinada",
      "Mantenha core ativo",
      "Controle respiração",
    ],
    tips: [
      "Exercício funcional",
      "Mantenha postura",
      "Core sempre ativo",
      "Controle o movimento",
    ],
    commonMistakes: [
      "Postura incorreta",
      "Não contrair core",
      "Peso desequilibrado",
      "Forma incorreta",
    ],
    benefits: [
      "Força funcional",
      "Estabilidade",
      "Força de pegada",
      "Condicionamento",
    ],
  },
  {
    id: "turkish-get-up",
    name: "Levantamento Turco",
    primaryMuscles: ["funcional"],
    secondaryMuscles: ["core", "ombros", "pernas"],
    difficulty: "avancado",
    equipment: ["Kettlebell"],
    instructions: [
      "Deite-se segurando kettlebell",
      "Eleve kettlebell com um braço",
      "Levante-se em etapas",
      "Mantenha kettlebell estável",
      "Inverta movimento",
    ],
    tips: [
      "Exercício avançado",
      "Movimento complexo",
      "Controle total necessário",
      "Comece sem peso",
    ],
    commonMistakes: [
      "Peso excessivo",
      "Forma incorreta",
      "Não controlar movimento",
      "Kettlebell instável",
    ],
    benefits: [
      "Exercício funcional completo",
      "Estabilidade",
      "Coordenação",
      "Força",
    ],
    scientificEvidence:
      "Turkish get-up é considerado um dos exercícios mais completos para desenvolvimento de força funcional e estabilidade.",
  },
  {
    id: "prowler-push",
    name: "Empurrar Trenó",
    primaryMuscles: ["funcional"],
    secondaryMuscles: ["pernas", "gluteos", "core", "ombros"],
    difficulty: "avancado",
    equipment: ["Trenó"],
    instructions: [
      "Posicione-se atrás do trenó",
      "Empurre com corpo todo",
      "Mantenha postura baixa",
      "Use pernas e core",
      "Controle o movimento",
    ],
    tips: [
      "Exercício avançado",
      "Alta intensidade",
      "Use corpo todo",
      "Controle respiração",
    ],
    commonMistakes: [
      "Usar apenas braços",
      "Postura incorreta",
      "Não usar pernas",
      "Fadiga rápida",
    ],
    benefits: [
      "Alto gasto calórico",
      "Potência",
      "Condicionamento",
      "Força funcional",
    ],
  },
  {
    id: "sled-pull",
    name: "Puxar Trenó",
    primaryMuscles: ["funcional"],
    secondaryMuscles: ["costas", "pernas", "gluteos", "core"],
    difficulty: "avancado",
    equipment: ["Trenó"],
    instructions: [
      "Segure corda do trenó",
      "Puxe caminhando para trás",
      "Use corpo todo",
      "Mantenha postura",
      "Controle o movimento",
    ],
    tips: [
      "Exercício avançado",
      "Use corpo todo",
      "Mantenha postura",
      "Controle respiração",
    ],
    commonMistakes: [
      "Postura incorreta",
      "Não usar corpo todo",
      "Fadiga rápida",
      "Forma incorreta",
    ],
    benefits: [
      "Alto gasto calórico",
      "Força posterior",
      "Condicionamento",
      "Força funcional",
    ],
  },
];

export const educationalLessons: EducationalLesson[] = [
  {
    id: "lesson-hypertrophy",
    title: "Ciência da Hipertrofia Muscular",
    category: "training-science",
    content: `
A hipertrofia muscular é o aumento do tamanho das células musculares através de três mecanismos principais:

1. **Tensão Mecânica**: O estímulo mais importante. Ocorre quando o músculo gera força contra resistência progressiva. Cargas de 60-85% de 1RM são ideais.

2. **Estresse Metabólico**: O "pump" sentido durante o treino. Acúmulo de metabólitos como lactato e íons de hidrogênio que sinalizam crescimento muscular.

3. **Dano Muscular**: Microlesões nas fibras durante o treino, especialmente na fase excêntrica, que estimulam reparo e crescimento.

**Princípios Fundamentais:**
- Volume total: 10-20 séries por grupo muscular por semana
- Frequência: 2-3x por semana por músculo
- Intensidade: 6-12 repetições para hipertrofia
- Progressão de carga é essencial

**Evidências Científicas:**
Estudos recentes (Schoenfeld, 2021) mostram que o volume total de treino é o fator mais correlacionado com ganhos musculares, seguido por frequência e progressão de carga.
    `,
    keyPoints: [
      "Tensão mecânica é o driver primário de hipertrofia",
      "10-20 séries semanais por grupo muscular",
      "Progressão de carga é essencial",
      "Recuperação adequada é fundamental",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é o mecanismo mais importante para hipertrofia?",
          options: [
            "Estresse metabólico",
            "Tensão mecânica",
            "Dano muscular",
            "Tempo sob tensão",
          ],
          correctAnswer: 1,
          explanation:
            "A tensão mecânica é considerada o principal mecanismo de hipertrofia. Estudos mostram que é necessário aplicar sobrecarga progressiva (aumentar carga, séries ou repetições) para criar estímulo suficiente para crescimento muscular.",
        },
        {
          question: "Qual volume semanal é recomendado por grupo muscular?",
          options: [
            "5-10 séries",
            "10-20 séries",
            "20-30 séries",
            "30-40 séries",
          ],
          correctAnswer: 1,
          explanation:
            "Para a maioria dos praticantes, 10-20 séries semanais por grupo muscular é o volume ideal. Menos de 10 séries pode ser insuficiente para hipertrofia, enquanto mais de 30 séries pode levar a overreaching e reduzir recuperação.",
        },
      ],
    },
  },
  {
    id: "lesson-protein",
    title: "Proteína e Síntese Muscular",
    category: "nutrition",
    content: `
A proteína é essencial para construção e reparo muscular. Entenda como otimizar:

**Quantidade Diária:**
- Iniciantes: 1.6g/kg de peso corporal
- Intermediários/Avançados: 2.0-2.2g/kg
- Cutting: Até 2.4g/kg para preservar massa magra

**Timing:**
- Janela anabólica: 24-48h após o treino (não apenas 30min)
- Distribuir em 4-5 refeições de 25-40g
- Proteína antes de dormir previne catabolismo noturno

**Fontes de Qualidade:**
- Alto valor biológico: ovos, whey, carne, peixe
- Vegetais: combinação de leguminosas e cereais
- Leucina é o aminoácido-chave: 2-3g por refeição

**Síntese Proteica Muscular (MPS):**
Maximizada com 25-40g de proteína de qualidade. Mais que isso não aumenta MPS proporcionalmente.
    `,
    keyPoints: [
      "1.6-2.2g de proteína por kg de peso corporal",
      "Distribuir em múltiplas refeições",
      "Leucina é crucial para MPS",
      "Janela anabólica dura 24-48h",
    ],
    duration: 6,
    xpReward: 20,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Quanto de proteína por kg é recomendado para hipertrofia?",
          options: ["1.0-1.2g/kg", "1.6-2.2g/kg", "3.0-4.0g/kg", "0.8g/kg"],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-recovery",
    title: "Recuperação e Crescimento Muscular",
    category: "recovery",
    content: `
O crescimento muscular ocorre durante o descanso, não durante o treino. Otimize sua recuperação:

**Sono:**
- 7-9 horas por noite
- Durante o sono profundo ocorre 70% da secreção de GH
- Falta de sono reduz síntese proteica em até 18%

**Nutrição Pós-Treino:**
- Proteína: 25-40g
- Carboidratos: 0.5-1g/kg para repor glicogênio
- Timing flexível dentro de 24h

**Técnicas de Recuperação:**
- Alongamento e mobilidade
- Massagem e foam rolling
- Crioterapia e contraste térmico
- Recuperação ativa (caminhada leve)

**Overtraining:**
Sinais: fadiga persistente, insônia, queda de performance, aumento de cortisol. Respeite os dias de descanso.
    `,
    keyPoints: [
      "7-9 horas de sono são essenciais",
      "Nutrição pós-treino dentro de 24h",
      "Recuperação ativa ajuda",
      "Overtraining prejudica ganhos",
    ],
    duration: 7,
    xpReward: 20,
    completed: false,
  },
  {
    id: "lesson-periodization",
    title: "Periodização do Treinamento",
    category: "training-science",
    content: `
A periodização é a organização sistemática do treinamento ao longo do tempo para maximizar adaptações e prevenir estagnação.

**Tipos de Periodização:**

1. **Linear**: Aumento progressivo de intensidade com redução de volume
   - Fase 1: Alta volume, baixa intensidade (8-12 reps)
   - Fase 2: Volume médio, intensidade média (6-8 reps)
   - Fase 3: Baixo volume, alta intensidade (3-6 reps)

2. **Não-Linear (Undulating)**: Variação diária/semanal de intensidade
   - Dia 1: Alta volume (3x12)
   - Dia 2: Força (5x5)
   - Dia 3: Potência (4x3)

3. **Blocos**: Períodos focados (3-4 semanas cada)
   - Bloco 1: Acumulação (volume)
   - Bloco 2: Intensificação (força)
   - Bloco 3: Realização (potência)

**Benefícios:**
- Previne estagnação e platôs
- Maximiza adaptações específicas
- Reduz risco de overtraining
- Melhora performance a longo prazo

**Evidências:**
Meta-análises mostram 13-20% maiores ganhos com periodização comparado a treino não-periodizado (Rhea et al., 2003).
    `,
    keyPoints: [
      "Variação sistemática de volume e intensidade",
      "Previne estagnação e overtraining",
      "3 tipos principais: linear, não-linear e blocos",
      "Pode aumentar ganhos em 13-20%",
    ],
    duration: 10,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é o principal benefício da periodização?",
          options: [
            "Aumentar volume sempre",
            "Prevenir estagnação e maximizar adaptações",
            "Treinar mais vezes por semana",
            "Reduzir tempo de treino",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Na periodização linear, o que acontece com a intensidade ao longo do tempo?",
          options: [
            "Permanecer constante",
            "Aumentar progressivamente",
            "Diminuir",
            "Variar aleatoriamente",
          ],
          correctAnswer: 1,
        },
        {
          question: "Quantos tipos principais de periodização existem?",
          options: ["1", "2", "3", "4"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-carbs",
    title: "Carboidratos e Performance",
    category: "nutrition",
    content: `
Os carboidratos são a principal fonte de energia para exercícios de alta intensidade e fundamentais para recuperação.

**Funções Principais:**
- Reposição de glicogênio muscular e hepático
- Fornece energia para exercícios de força e HIIT
- Preserva proteína muscular (efeito poupador)
- Melhora recuperação pós-treino

**Necessidades por Tipo de Treino:**

**Treino de Força (Resistência):**
- 4-6g/kg de peso corporal
- Exemplo: 80kg = 320-480g/dia
- Timing: 40-60g antes e 1-1.2g/kg após treino

**Cardio de Alta Intensidade:**
- 6-8g/kg de peso corporal
- Importante para repor glicogênio rapidamente

**Treino Leve/Descanso:**
- 3-4g/kg de peso corporal
- Reduzir carboidratos em dias off mantém sensibilidade à insulina

**Tipos de Carboidratos:**
- **Rápidos** (alto IG): Arroz branco, batata, dextrose - pós-treino
- **Moderados**: Aveia, batata doce, quinoa - refeições gerais
- **Lentos** (baixo IG): Leguminosas, vegetais - antes de dormir

**Timing Estratégico:**
- Pré-treino (1-2h antes): 30-60g de carboidratos moderados
- Pós-treino (até 2h): 1-1.2g/kg para repor glicogênio
- Janela crítica: 30min-2h pós-treino é ideal mas não obrigatória

**Evidências:**
Consumo de carboidratos após treino aumenta síntese de glicogênio em 300% comparado a jejum (Ivy et al., 2002).
    `,
    keyPoints: [
      "4-6g/kg para treino de força",
      "Glicogênio é energia primária para exercícios",
      "Timing pós-treino maximiza reposição",
      "Preserva proteína muscular",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Quantos gramas de carboidrato por kg são recomendados para treino de força?",
          options: ["2-3g/kg", "4-6g/kg", "8-10g/kg", "1-2g/kg"],
          correctAnswer: 1,
        },
        {
          question: "Qual é a função principal dos carboidratos no exercício?",
          options: [
            "Aumentar massa muscular",
            "Fornecer energia e repor glicogênio",
            "Queimar gordura",
            "Aumentar testosterona",
          ],
          correctAnswer: 1,
          explanation:
            "Os carboidratos são a principal fonte de energia durante exercícios de alta intensidade. Eles são convertidos em glicose e armazenados como glicogênio nos músculos e fígado, fornecendo combustível rápido para contrações musculares e repondo os estoques após o treino.",
        },
        {
          question: "Qual tipo de carboidrato é melhor pós-treino?",
          options: [
            "Carboidratos de baixo índice glicêmico",
            "Carboidratos de alto índice glicêmico",
            "Apenas fibra",
            "Não importa",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-fats",
    title: "Gorduras e Saúde Hormonal",
    category: "nutrition",
    content: `
As gorduras são essenciais para produção hormonal, absorção de vitaminas e saúde geral.

**Funções Críticas:**
- Produção de testosterona e outros hormônios esteróides
- Absorção de vitaminas lipossolúveis (A, D, E, K)
- Regulação da inflamação
- Saúde cerebral e função cognitiva
- Fornece energia para atividades de baixa intensidade

**Necessidades Diárias:**
- Mínimo: 0.5g/kg (manter funções básicas)
- Ideal para atletas: 0.8-1.2g/kg
- Para produção hormonal ótima: 1-1.5g/kg

**Tipos de Gorduras:**

**Gorduras Saturadas:**
- Fontes: Carne, ovos, laticínios, óleo de coco
- Importante para produção de testosterona
- 30-40% da gordura total

**Gorduras Monoinsaturadas:**
- Fontes: Azeite, abacate, nozes, amendoim
- Reduzem colesterol LDL
- 40-50% da gordura total

**Gorduras Poli-insaturadas:**
- Ômega-3: Peixes gordos, linhaça, chia (anti-inflamatório)
- Ômega-6: Óleos vegetais (moderar consumo)
- 20-30% da gordura total

**Gorduras Trans:**
- Evitar completamente (processados, margarina)

**Impacto Hormonal:**
Dietas muito baixas em gordura (<15% calorias) podem reduzir testosterona em 10-15%. Gorduras saturadas e monoinsaturadas são especialmente importantes para síntese hormonal.

**Timing:**
Distribuir ao longo do dia. Não há necessidade de timing específico pós-treino para gorduras.
    `,
    keyPoints: [
      "0.8-1.2g/kg de gordura diária",
      "Essencial para produção hormonal",
      "30-40% saturadas, 40-50% monoinsaturadas",
      "Dietas muito baixas em gordura reduzem testosterona",
    ],
    duration: 7,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Qual é a função mais importante das gorduras para atletas?",
          options: [
            "Fornecer energia rápida",
            "Produção hormonal e saúde celular",
            "Aumentar massa muscular diretamente",
            "Queimar gordura",
          ],
          correctAnswer: 1,
        },
        {
          question: "Quantos gramas de gordura por kg são ideais para atletas?",
          options: ["0.2-0.4g/kg", "0.8-1.2g/kg", "2-3g/kg", "0.1g/kg"],
          correctAnswer: 1,
        },
        {
          question:
            "Qual tipo de gordura é especialmente importante para testosterona?",
          options: [
            "Gorduras trans",
            "Gorduras saturadas e monoinsaturadas",
            "Apenas ômega-3",
            "Não importa",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-hiit-vs-steady",
    title: "HIIT vs Cardio Steady-State",
    category: "training-science",
    content: `
Entenda as diferenças entre treinos de alta intensidade (HIIT) e cardio contínuo de baixa intensidade.

**HIIT (High-Intensity Interval Training):**

**Características:**
- Intervalos curtos de esforço máximo (20-60s)
- Períodos de descanso ativo/passivo
- Duração total: 15-30 minutos
- 85-95% frequência cardíaca máxima

**Benefícios:**
- Melhora VO2 max mais rapidamente
- Queima mais calorias pós-treino (EPOC)
- Preserva massa muscular melhor
- Economia de tempo
- Melhora sensibilidade à insulina

**Desvantagens:**
- Alto estresse no sistema nervoso
- Requer mais recuperação
- Risco de lesão se técnica ruim
- Não ideal para iniciantes

**Cardio Steady-State (LISS):**

**Características:**
- Intensidade constante e moderada
- 60-70% frequência cardíaca máxima
- Duração: 30-60+ minutos
- Conversação possível

**Benefícios:**
- Baixo impacto no sistema nervoso
- Melhor para recuperação ativa
- Acesso fácil a iniciantes
- Melhora capacidade aeróbica de base
- Baixo risco de lesão

**Desvantagens:**
- Mais tempo necessário
- Menor EPOC
- Pode interferir com ganhos de força se excessivo

**Recomendações:**
- **Cutting**: HIIT 2-3x/semana para preservar músculo
- **Bulking**: LISS 1-2x/semana para não interferir na recuperação
- **Recomposição**: Mistura de ambos
- **Iniciantes**: Começar com LISS e gradualmente introduzir HIIT

**Evidências:**
HIIT pode queimar 25-30% mais calorias no mesmo tempo e melhorar condicionamento aeróbico em 3x menos tempo (Boutcher, 2011).
    `,
    keyPoints: [
      "HIIT: mais eficiente em tempo, maior EPOC",
      "LISS: melhor para recuperação e iniciantes",
      "HIIT preserva mais massa muscular no cutting",
      "Combinação de ambos é ideal",
    ],
    duration: 9,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Qual é a principal vantagem do HIIT comparado ao cardio contínuo?",
          options: [
            "Mais tempo de treino",
            "Maior EPOC e economia de tempo",
            "Mais fácil de executar",
            "Melhor para iniciantes",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual é a frequência cardíaca ideal para HIIT?",
          options: [
            "50-60% FCmax",
            "60-70% FCmax",
            "85-95% FCmax",
            "40-50% FCmax",
          ],
          correctAnswer: 2,
        },
        {
          question: "Para cutting, qual tipo de cardio é mais recomendado?",
          options: [
            "Apenas LISS",
            "Apenas HIIT",
            "HIIT 2-3x por semana",
            "Não fazer cardio",
          ],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-bulk-cut",
    title: "Bulk e Cut: Estratégias de Composição Corporal",
    category: "nutrition",
    content: `
Bulk e Cut são fases estratégicas para maximizar ganhos musculares e depois reduzir gordura corporal.

**Fase de Bulk (Volume):**

**Objetivo:**
Ganhar massa muscular com mínimo ganho de gordura.

**Estratégia Nutricional:**
- Superávit calórico moderado: +300-500 calorias/dia
- Ganho de peso: 0.25-0.5kg/semana (ideal)
- Proteína: 2.2-2.4g/kg
- Carboidratos: 5-6g/kg
- Gordura: 1-1.2g/kg

**Duração:**
- Iniciantes: 8-12 meses
- Intermediários: 4-6 meses
- Avançados: 2-4 meses

**Sinais de que está funcionando:**
- Ganho de força consistente
- Medidas corporais aumentando
- Ganho de peso controlado
- Recuperação adequada

**Fase de Cut (Definição):**

**Objetivo:**
Reduzir gordura preservando massa muscular.

**Estratégia Nutricional:**
- Déficit calórico: -300-750 calorias/dia
- Perda de peso: 0.5-1% do peso corporal/semana
- Proteína: 2.4-2.8g/kg (aumentar para preservar músculo)
- Carboidratos: 2-4g/kg (reduzir gradualmente)
- Gordura: 0.8-1g/kg (manter para hormônios)

**Duração:**
- 8-16 semanas (depende da gordura inicial)
- Não prolongar mais que necessário

**Sinais de que está funcionando:**
- Perda de gordura visível
- Força mantida ou levemente reduzida
- Músculos mais definidos
- Níveis de energia razoáveis

**Recomposição Corporal:**
Para iniciantes/intermediários: manter calorias em manutenção com treino e nutrição adequados permite ganhar músculo e perder gordura simultaneamente.

**Erros Comuns:**
- Bulk muito agressivo (+1000+ calorias) = ganho de gordura excessivo
- Cut muito agressivo (<1000 calorias) = perda de massa muscular
- Bulk infinito sem fase de cut
- Não ajustar macros durante cut
    `,
    keyPoints: [
      "Bulk: +300-500 calorias, 0.25-0.5kg/semana",
      "Cut: -300-750 calorias, 0.5-1% peso/semana",
      "Aumentar proteína no cut para preservar músculo",
      "Recomposição possível para iniciantes",
    ],
    duration: 10,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual superávit calórico é ideal para um bulk eficiente?",
          options: [
            "+100-200 calorias",
            "+300-500 calorias",
            "+800-1000 calorias",
            "+1500 calorias",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Quanto de proteína por kg deve-se consumir durante um cut?",
          options: ["1.6g/kg", "2.0g/kg", "2.4-2.8g/kg", "3.5g/kg"],
          correctAnswer: 2,
        },
        {
          question: "Qual é a perda de peso semanal ideal durante um cut?",
          options: [
            "2-3% do peso corporal",
            "0.5-1% do peso corporal",
            "5% do peso corporal",
            "Não importa",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-supplements",
    title: "Suplementação Baseada em Evidências",
    category: "nutrition",
    content: `
Nem todos os suplementos são necessários, mas alguns têm evidências científicas sólidas.

**Suplementos Essenciais (Tier 1):**

**1. Whey Protein:**
- Conveniência para atingir meta proteica
- Rápida absorção pós-treino
- Dose: 20-40g após treino ou entre refeições
- Evidência: Forte para conveniência e MPS

**2. Creatina Monohidratada:**
- Aumenta força e potência em 5-15%
- Melhora performance em séries de 6-12 reps
- Dose: 3-5g/dia (manutenção), 20g/dia por 5 dias (saturação)
- Evidência: Mais estudado, segurança comprovada

**3. Vitamina D3:**
- Importante para saúde óssea e imunidade
- Muitos atletas têm deficiência
- Dose: 2000-4000 UI/dia
- Evidência: Importante para quem treina em ambientes fechados

**Suplementos Úteis (Tier 2):**

**4. Cafeína:**
- Aumenta performance em 5-12%
- Reduz percepção de esforço
- Dose: 3-6mg/kg (200-400mg para 70kg)
- Timing: 30-60min antes do treino
- Evidência: Forte para performance

**5. Beta-Alanina:**
- Aumenta capacidade de trabalho em séries múltiplas
- Dose: 3-5g/dia
- Efeito: Formigamento normal (parestesia)
- Evidência: Moderada para resistência muscular

**6. Ômega-3 (EPA/DHA):**
- Anti-inflamatório
- Saúde cardiovascular
- Dose: 1-2g EPA+DHA/dia
- Evidência: Forte para saúde geral

**Suplementos Questionáveis:**
- BCAAs (desnecessário se consumir proteína suficiente)
- Testosterona boosters (evidência fraca)
- Termogênicos (efeito mínimo)
- Glutamina (desnecessário com dieta adequada)

**Evidências:**
Creatina é o suplemento mais estudado e eficaz para ganhos de força (Kreider et al., 2017). Café/cafeína tem evidência nível A para performance (Guest et al., 2021).
    `,
    keyPoints: [
      "Tier 1: Whey, Creatina, Vitamina D",
      "Tier 2: Cafeína, Beta-Alanina, Ômega-3",
      "Creatina: suplemento mais estudado e eficaz",
      "Muitos suplementos são desnecessários com dieta adequada",
    ],
    duration: 9,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual suplemento tem a evidência científica mais forte?",
          options: [
            "BCAA",
            "Creatina Monohidratada",
            "Testosterona booster",
            "Glutamina",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Qual é a dose diária recomendada de creatina para manutenção?",
          options: ["1g/dia", "3-5g/dia", "20g/dia", "50g/dia"],
          correctAnswer: 1,
        },
        {
          question: "Quanto de cafeína é recomendado antes do treino?",
          options: [
            "50-100mg",
            "200-400mg (3-6mg/kg)",
            "500-800mg",
            "Não há recomendação",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-injury-prevention",
    title: "Prevenção de Lesões no Treino",
    category: "training-science",
    content: `
Prevenir lesões é mais importante que tratar. Entenda como manter-se seguro no treino.

**Princípios Fundamentais:**

**1. Progressão Gradual:**
- Aumentar carga em 2.5-5% por semana máximo
- Volume: aumentar 1-2 séries por semana
- Não aumentar carga e volume simultaneamente
- Respeitar adaptação do tecido conjuntivo (mais lenta que músculo)

**2. Aquecimento Adequado:**
- 5-10 minutos de cardio leve (eleva temperatura corporal)
- Mobilidade dinâmica (não alongamento estático pré-treino)
- Séries de aquecimento progressivas (50%, 70%, 90% da carga de trabalho)
- Ativação de músculos específicos (glúteos, core, manguito rotador)

**3. Técnica Correta:**
- Priorizar forma sobre carga sempre
- Amplitude completa de movimento
- Controle excêntrico (descer devagar)
- Não usar impulso excessivo
- Alinhamento adequado (joelhos, coluna, punhos)

**4. Balanceamento Muscular:**
- Manter proporção flexor:extensor adequada
- Quadríceps:Isquiotibiais (3:2)
- Peitoral:Dorsais (1:2 em volume)
- Agonistas:Antagonistas equilibrados

**5. Recuperação:**
- 48-72h entre treinos do mesmo grupo muscular
- Sono adequado (7-9h)
- Hidratação (35-40ml/kg)
- Nutrição pós-treino
- Mobilidade e alongamento em dias off

**Lesões Comuns e Prevenção:**

**Ombros:**
- Fortalecer manguito rotador (rotações externas)
- Evitar impingimento (elevações muito altas)
- Aquecer adequadamente antes de exercícios de empurrar

**Lombar:**
- Fortalecer core e glúteos
- Manter coluna neutra em levantamentos
- Evitar flexão repetitiva da coluna

**Joelhos:**
- Fortalecer quadríceps e glúteos
- Alinhar joelhos com pés em agachamentos
- Evitar valgo dinâmico (joelho caindo para dentro)

**Cotovelos:**
- Balancear flexores:extensores
- Variar pegadas e ângulos
- Não fazer extensões excessivas

**Evidências:**
Programas de prevenção de lesões podem reduzir lesões em 30-50% (Lauersen et al., 2014). Aquecimento adequado reduz risco de lesão em 32% (Fradkin et al., 2010).
    `,
    keyPoints: [
      "Progressão gradual: 2.5-5% carga por semana",
      "Aquecimento reduz lesões em 32%",
      "Técnica sempre antes de carga",
      "Balanceamento muscular previne desequilíbrios",
    ],
    duration: 10,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é o aumento de carga semanal máximo recomendado?",
          options: ["10-15%", "2.5-5%", "20-30%", "Não importa"],
          correctAnswer: 1,
        },
        {
          question: "Qual tipo de alongamento é recomendado ANTES do treino?",
          options: [
            "Alongamento estático",
            "Mobilidade dinâmica",
            "Alongamento passivo",
            "Não fazer alongamento",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Quanto tempo de descanso é recomendado entre treinos do mesmo grupo muscular?",
          options: ["12 horas", "24 horas", "48-72 horas", "1 semana"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-form-technique",
    title: "Técnica e Forma dos Exercícios",
    category: "form",
    content: `
A técnica correta é fundamental para resultados e segurança. Entenda os princípios universais.

**Princípios Universais de Técnica:**

**1. Controle do Movimento:**
- Fase excêntrica (negativa): 2-3 segundos de descida controlada
- Pausa isométrica (se aplicável): 1 segundo
- Fase concêntrica (positiva): 1-2 segundos de subida explosiva mas controlada
- Não usar momentum ou impulso

**2. Amplitude Completa de Movimento (ROM):**
- Usar toda amplitude possível com segurança
- Exemplo: Agachamento até paralelo ou abaixo
- Exemplo: Supino tocando o peito
- ROM completo = mais ativação muscular

**3. Respiração:**
- Inspirar na fase excêntrica (descer)
- Expirar na fase concêntrica (subir)
- Valsalva maneuver: Pressão intra-abdominal em cargas pesadas (>85% 1RM)
- Segurar ar momentaneamente no ponto mais difícil

**4. Alinhamento Postural:**
- **Coluna**: Neutra (não hiperestender ou arredondar)
- **Joelhos**: Alinhados com pés, não valgo (para dentro)
- **Ombros**: Retraídos e deprimidos (puxados para trás e para baixo)
- **Pés**: Plantados no chão, peso distribuído

**Exercícios Específicos:**

**Agachamento:**
- Pés na largura dos ombros/quadris
- Joelhos seguem direção dos pés
- Descida até quadris abaixo dos joelhos
- Empurrar através dos calcanhares
- Tronco ereto (não inclinar demais)

**Supino:**
- Retrair escápulas no banco
- Arco leve nas costas (não excessivo)
- Cotovelos a 45-60 graus (não 90 graus)
- Barra tocando linha dos mamilos
- Controle total do movimento

**Levantamento Terra:**
- Barra próxima às canelas
- Coluna neutra desde o início
- Quadris e joelhos se estendem simultaneamente
- Barra desliza pelas pernas
- Não arredondar coluna lombar

**Barra Fixa:**
- Retrair escápulas primeiro
- Puxar cotovelos, não apenas subir
- Queixo passa a barra
- Descida controlada (não soltar)

**Evidências:**
ROM completo ativa 20-40% mais fibras musculares (Bloomquist et al., 2013). Controle excêntrico é crucial para hipertrofia (Roig et al., 2009).
    `,
    keyPoints: [
      "Controle excêntrico: 2-3 segundos",
      "ROM completo ativa 20-40% mais fibras",
      "Respirar corretamente aumenta força",
      "Técnica sempre antes de carga",
    ],
    duration: 9,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Quanto tempo deve durar a fase excêntrica (negativa)?",
          options: [
            "0.5 segundos",
            "2-3 segundos",
            "5-6 segundos",
            "Não importa",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual é a posição dos cotovelos ideal no supino?",
          options: [
            "90 graus (completamente aberto)",
            "45-60 graus",
            "0 graus (fechado)",
            "Não importa",
          ],
          correctAnswer: 1,
        },
        {
          question: "O que fazer primeiro em uma barra fixa?",
          options: [
            "Puxar com os braços",
            "Retrair as escápulas",
            "Usar impulso",
            "Não importa a ordem",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-sleep-performance",
    title: "Sono e Performance no Treino",
    category: "recovery",
    content: `
O sono é um dos pilares mais importantes para recuperação e ganhos musculares.

**Por que o Sono é Fundamental:**

**1. Síntese de Hormônios:**
- 70% do Hormônio do Crescimento (GH) é secretado durante sono profundo
- Testosterona: Pico durante REM (últimas horas de sono)
- Cortisol: Reduz durante sono, aumenta ao acordar
- Privação de sono = cortisol elevado = catabolismo

**2. Recuperação Muscular:**
- Reparo de microlesões ocorre principalmente durante sono
- Síntese proteica aumenta durante sono
- Falta de sono reduz síntese proteica em 18%
- 1 noite mal dormida = 2 dias de recuperação comprometida

**3. Performance:**
- 1 noite de privação reduz força em 2-5%
- Afeta coordenação e técnica
- Reduz motivação e foco
- Aumenta percepção de esforço

**Necessidades de Sono:**
- **Mínimo**: 7 horas (funcional mas não ideal)
- **Ideal**: 7-9 horas para adultos
- **Atletas**: 8-10 horas podem ser benéficas
- **Qualidade > Quantidade**: Sono profundo contínuo é crucial

**Ciclos de Sono:**
- **NREM (N1-N3)**: Sono leve a profundo
- **REM**: Sonhos, consolidação de memória
- Ciclo completo: ~90 minutos
- 4-6 ciclos por noite ideal

**Como Melhorar o Sono:**

**Higiênica do Sono:**
- Horário consistente (mesmo fim de semana)
- Quarto escuro (cortinas blackout)
- Temperatura: 18-20°C ideal
- Sem telas 1-2h antes de dormir
- Rotina relaxante (leitura, alongamento leve)

**Nutrição:**
- Evitar refeições grandes 2-3h antes
- Proteína antes de dormir pode ajudar (caseína)
- Evitar cafeína após 14h
- Álcool reduz qualidade do sono (evitar)

**Exercício:**
- Treinar regularmente melhora sono
- Evitar treino intenso 2-3h antes de dormir
- Treino de manhã pode melhorar sono noturno

**Suplementos:**
- Melatonina: 0.5-3mg (ajuda início do sono)
- Magnésio: 200-400mg (relaxamento muscular)
- ZMA: Zinco + Magnésio + B6

**Evidências:**
Estudos mostram que dormir <6h reduz ganhos musculares em 60% comparado a 8h+ (Dattilo et al., 2011). Uma noite de privação aumenta cortisol em 37% e reduz testosterona em 15% (Leproult & Van Cauter, 2011).
    `,
    keyPoints: [
      "7-9 horas de sono ideal para atletas",
      "70% do GH secretado durante sono profundo",
      "Privação reduz síntese proteica em 18%",
      "Uma noite ruim = 2 dias de recuperação comprometida",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Quantas horas de sono são ideais para atletas?",
          options: ["5-6 horas", "7-9 horas", "10-12 horas", "Não importa"],
          correctAnswer: 1,
        },
        {
          question:
            "Quanto do Hormônio do Crescimento é secretado durante o sono?",
          options: ["30%", "50%", "70%", "90%"],
          correctAnswer: 2,
        },
        {
          question: "Quanto a privação de sono reduz a síntese proteica?",
          options: ["5%", "10%", "18%", "30%"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-hydration",
    title: "Hidratação e Performance",
    category: "nutrition",
    content: `
A hidratação adequada é crucial para performance, recuperação e saúde geral.

**Importância da Água:**

**Funções no Corpo:**
- Transporte de nutrientes
- Regulação de temperatura
- Lubrificação de articulações
- Digestão e absorção
- Eliminação de resíduos

**Impacto na Performance:**
- Desidratação de 2% reduz performance em 10-15%
- 3-5% de desidratação: Reduz força, resistência e coordenação
- >5%: Risco de cãibras, fadiga extrema, confusão mental

**Necessidades Diárias:**

**Base:**
- 35-40ml por kg de peso corporal
- Exemplo: 70kg = 2.5-2.8L/dia
- Ajustar por clima, atividade e suor

**Durante Treino:**
- 150-300ml a cada 15-20 minutos
- Treinos <1h: Água é suficiente
- Treinos >1h: Considerar eletrólitos

**Pós-Treino:**
- Repor 150% do peso perdido em suor
- Exemplo: Perdeu 1kg = beber 1.5L
- Incluir sódio se suou muito

**Sinais de Desidratação:**
- Sede (já indica 1-2% desidratado)
- Urina escura
- Fadiga
- Dor de cabeça
- Cãibras musculares
- Tontura

**Eletrólitos:**

**Sódio:**
- Perdido mais no suor (principal eletrólito)
- Necessário para retenção de água
- 1-2g/hora de exercício intenso

**Potássio:**
- Importante para contração muscular
- Fontes: Bananas, batata, coco

**Magnésio:**
- Regula função muscular
- Perdido em menor quantidade

**Quando Usar Bebidas Esportivas:**
- Treinos >60-90 minutos
- Suor excessivo
- Clima quente
- Treinos múltiplos no dia

**Água vs Bebidas Esportivas:**
- **Água**: Treinos <1h, baixa intensidade
- **Bebidas esportivas**: Treinos longos, alta intensidade, calor extremo

**Evidências:**
Perda de apenas 2% do peso corporal em água reduz força em 6-8% e aumenta percepção de esforço (Cheuvront et al., 2010). Hidratação adequada melhora recuperação pós-treino significativamente.
    `,
    keyPoints: [
      "35-40ml/kg de peso corporal diário",
      "2% de desidratação reduz performance 10-15%",
      "Repor 150% do peso perdido pós-treino",
      "Eletrólitos necessários para treinos >1h",
    ],
    duration: 7,
    xpReward: 20,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Quantos ml de água por kg de peso são recomendados diariamente?",
          options: ["20-25ml/kg", "35-40ml/kg", "50-60ml/kg", "Não importa"],
          correctAnswer: 1,
        },
        {
          question: "Quanto de desidratação reduz performance em 10-15%?",
          options: ["1%", "2%", "5%", "10%"],
          correctAnswer: 1,
        },
        {
          question: "Quando usar bebidas esportivas ao invés de água?",
          options: [
            "Sempre",
            "Treinos >60-90 minutos",
            "Nunca",
            "Apenas pela manhã",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-cardio-heart-rate",
    title: "Zonas de Frequência Cardíaca",
    category: "training-science",
    content: `
Entender zonas de frequência cardíaca permite treinar na intensidade correta para seus objetivos.

**Cálculo da Frequência Cardíaca Máxima (FCmax):**
- Fórmula simples: 220 - idade
- Mais precisa: 208 - (0.7 × idade)
- Exemplo: 30 anos = 208 - 21 = 187 bpm

**Zonas de Treinamento:**

**Zona 1: Recuperação Ativa (50-60% FCmax)**
- Sensação: Muito fácil, conversa confortável
- Uso: Recuperação, aquecimento, resfriamento
- Benefícios: Melhora circulação, recuperação
- Duração: 20-60 minutos

**Zona 2: Aeróbica Base (60-70% FCmax)**
- Sensação: Fácil, conversa possível
- Uso: Cardio de baixa intensidade, base aeróbica
- Benefícios: Melhora eficiência energética, queima gordura
- Duração: 30-90+ minutos
- **Ideal para: Building base, recuperação, perda de gordura**

**Zona 3: Aeróbica (70-80% FCmax)**
- Sensação: Moderada, conversa difícil
- Uso: Cardio moderado, condicionamento
- Benefícios: Melhora VO2 max, endurance
- Duração: 20-60 minutos

**Zona 4: Anaeróbica (80-90% FCmax)**
- Sensação: Difícil, poucas palavras
- Uso: HIIT, intervalos intensos
- Benefícios: Melhora capacidade anaeróbica, VO2 max
- Duração: 3-10 minutos (intervalos)
- **Ideal para: HIIT, melhora de condicionamento rápido**

**Zona 5: Máxima (90-100% FCmax)**
- Sensação: Máximo esforço, sem fala
- Uso: Sprints, esforços máximos
- Benefícios: Melhora potência anaeróbica máxima
- Duração: 30 segundos - 2 minutos (intervalos)
- **Ideal para: Potência máxima, sprints**

**Aplicação Prática:**

**Para Perda de Gordura:**
- Zona 2 (60-70%): 70% do tempo
- Zona 4 (80-90%): 30% do tempo (HIIT)

**Para Condicionamento:**
- Mistura de Zona 3 e 4
- 2-3x HIIT por semana

**Para Recuperação:**
- Zona 1 ou 2
- 20-30 minutos

**Monitoramento:**
- Frequencímetro (mais preciso)
- Sensação (talk test)
- Escala de esforço percebido (RPE 1-10)

**Evidências:**
Treinar na zona correta melhora eficiência do treino em 40-60% (Seiler & Kjerland, 2006). Zona 2 é ideal para queima de gordura (60-70% da energia vem de gordura nessa zona).
    `,
    keyPoints: [
      "FCmax = 208 - (0.7 × idade)",
      "Zona 2 (60-70%): ideal para queima de gordura",
      "Zona 4 (80-90%): ideal para HIIT",
      "Treinar na zona correta aumenta eficiência 40-60%",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é a fórmula mais precisa para calcular FCmax?",
          options: [
            "220 - idade",
            "208 - (0.7 × idade)",
            "200 - idade",
            "210 - idade",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual zona é ideal para queima de gordura?",
          options: [
            "Zona 1 (50-60%)",
            "Zona 2 (60-70%)",
            "Zona 4 (80-90%)",
            "Zona 5 (90-100%)",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual zona é ideal para HIIT?",
          options: [
            "Zona 2 (60-70%)",
            "Zona 3 (70-80%)",
            "Zona 4 (80-90%)",
            "Zona 1 (50-60%)",
          ],
          correctAnswer: 2,
        },
      ],
    },
  },
];
