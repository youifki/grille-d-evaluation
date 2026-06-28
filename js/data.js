const AXES = [
  {
    id: 1, icon: "⚖️", color: "#3498db",
    title: "الحكامة والشفافية",
    titleFr: "Gouvernance et transparence",
    maxPoints: 10,
    indicators: [
      "انتظام دورات المجلس",
      "نشر القرارات والميزانيات",
      "التواصل مع المواطنين",
      "إشراك المجتمع المدني",
      "احترام أخلاقيات المرفق العام"
    ]
  },
  {
    id: 2, icon: "📋", color: "#2ecc71",
    title: "تنفيذ برنامج عمل الجماعة",
    titleFr: "Exécution du programme d'action",
    maxPoints: 15,
    indicators: [
      "مدى إنجاز المشاريع المبرمجة",
      "احترام الآجال",
      "معالجة المشاريع المتعثرة",
      "تحقيق الأهداف المعلنة"
    ]
  },
  {
    id: 3, icon: "💰", color: "#f39c12",
    title: "التدبير المالي والجبائي",
    titleFr: "Gestion financière et fiscale",
    maxPoints: 10,
    indicators: [
      "تعبئة الموارد المالية",
      "ترشيد النفقات",
      "وضوح الصفقات",
      "حجم الاستثمار المحلي"
    ]
  },
  {
    id: 4, icon: "🏗️", color: "#9b59b6",
    title: "البنية التحتية والتجهيزات",
    titleFr: "Infrastructure et équipements",
    maxPoints: 15,
    indicators: [
      "جودة الطرق والأرصفة",
      "الإنارة العمومية",
      "شبكات الماء والتطهير",
      "المرافق والأسواق والمقابر"
    ]
  },
  {
    id: 5, icon: "🌿", color: "#27ae60",
    title: "النظافة وحماية البيئة",
    titleFr: "Propreté et protection de l'environnement",
    maxPoints: 10,
    indicators: [
      "جمع النفايات",
      "نظافة الأحياء والشاطئ",
      "حماية البحيرة والفضاءات الطبيعية",
      "المساحات الخضراء"
    ]
  },
  {
    id: 6, icon: "🏙️", color: "#e67e22",
    title: "التعمير وتنظيم المجال",
    titleFr: "Urbanisme et organisation territoriale",
    maxPoints: 10,
    indicators: [
      "تدبير الرخص",
      "محاربة البناء العشوائي",
      "احترام جمالية المدينة",
      "معالجة مشاكل التجزئات"
    ]
  },
  {
    id: 7, icon: "📈", color: "#e74c3c",
    title: "التنمية الاقتصادية والسياحية",
    titleFr: "Développement économique et touristique",
    maxPoints: 10,
    indicators: [
      "تحسين جاذبية المدينة",
      "تنظيم الأنشطة السياحية",
      "دعم التجارة المحلية والمهن التقليدية",
      "تشجيع الاستثمار"
    ]
  },
  {
    id: 8, icon: "🤝", color: "#1abc9c",
    title: "الخدمات الاجتماعية والثقافية والرياضية",
    titleFr: "Services sociaux, culturels et sportifs",
    maxPoints: 10,
    indicators: [
      "دعم الجمعيات",
      "الأنشطة الثقافية والرياضية",
      "فضاءات الشباب",
      "العناية بالفئات الهشة"
    ]
  },
  {
    id: 9, icon: "👥", color: "#2980b9",
    title: "جودة العلاقة مع الساكنة",
    titleFr: "Qualité de la relation avec les citoyens",
    maxPoints: 10,
    indicators: [
      "استقبال المواطنين",
      "معالجة الشكايات",
      "الاستجابة للمطالب",
      "التواصل الدوري مع الساكنة"
    ]
  }
];

const RATING_LABELS = ["منعدم", "ضعيف جداً", "ضعيف", "متوسط", "جيد", "ممتاز"];
const RATING_COLORS = ["#95a5a6", "#e74c3c", "#e67e22", "#f39c12", "#2ecc71", "#27ae60"];

const SCALE = [
  { min: 85, max: 100, label: "ممتاز", color: "#27ae60", bg: "#eafaf1",
    description: "حصيلة ممتازة وإنجازات ذات أثر واضح على الساكنة" },
  { min: 70, max: 84, label: "جيد", color: "#2ecc71", bg: "#f0fdf4",
    description: "حصيلة جيدة مع بعض الاختلالات القابلة للمعالجة" },
  { min: 50, max: 69, label: "متوسط", color: "#f39c12", bg: "#fffbeb",
    description: "حصيلة متوسطة تحتاج إلى تحسينات جوهرية" },
  { min: 30, max: 49, label: "ضعيف", color: "#e67e22", bg: "#fff7ed",
    description: "حصيلة ضعيفة مع قصور في عدة مجالات أساسية" },
  { min: 0, max: 29, label: "فاشل", color: "#e74c3c", bg: "#fef2f2",
    description: "فشل واضح في تحقيق الأهداف والالتزامات" }
];

const QUALITATIVE_QUESTIONS = [
  { id: "q1", text: "ما أهم ثلاثة إنجازات حققها المجلس خلال الولاية؟",
    placeholder: "اذكر الإنجازات الملموسة مع ذكر التواريخ والتكلفة عند الإمكان..." },
  { id: "q2", text: "ما أهم ثلاثة إخفاقات أو ملفات عالقة؟",
    placeholder: "اذكر المشاريع المتعثرة أو الملفات التي لم تعالج بالشكل المطلوب..." },
  { id: "q3", text: "هل تغيرت جودة العيش في المدينة خلال الولاية؟ كيف؟",
    placeholder: "قيّم الأثر الفعلي على حياة الساكنة اليومية..." },
  { id: "q4", text: "هل تم الحفاظ على المؤهلات البيئية والسياحية للمدينة؟",
    placeholder: "أشر إلى وضع البيئة والمجالات الطبيعية والسياحية..." },
  { id: "q5", text: "ما الأولويات التي ينبغي أن يتضمنها البرنامج الجماعي المقبل؟",
    placeholder: "اقترح الأولويات المستعجلة للولاية القادمة..." }
];
