import bcrypt from 'bcryptjs';
import type { Book, Chapter, Question, User } from '../types';

export interface SeedDataset {
  users: User[];
  books: Book[];
  chapters: Chapter[];
  questions: Question[];
}

export function buildSeedDataset(): SeedDataset {
  const now = new Date().toISOString();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@codeexam.dev').toLowerCase();

  const users: User[] = [
    {
      id: 'usr_admin_01',
      name: 'مدیر سیستم',
      email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      role: 'admin',
      createdAt: now,
    },
    {
      id: 'usr_student_01',
      name: 'سارا محمدی',
      email: 'student@codeexam.dev',
      passwordHash: bcrypt.hashSync('student1234', 10),
      role: 'user',
      createdAt: now,
    },
  ];

  const books: Book[] = [
    {
      id: 'bk_posd',
      title: 'A Philosophy of Software Design',
      author: 'John Ousterhout',
      topic: 'معماری و طراحی نرم‌افزار',
      description:
        'تحلیل عمیق پیچیدگی نرم‌افزار، طراحی ماژول‌های عمیق، پنهان‌سازی اطلاعات و مدیریت وابستگی‌ها در سیستم‌های بزرگ.',
      createdAt: now,
    },
    {
      id: 'bk_refactoring',
      title: 'Refactoring: Improving the Design of Existing Code',
      author: 'Martin Fowler',
      topic: 'کیفیت کد و بازآرایی',
      description:
        'اصول بازآرایی ایمن کدهای موجود، شناسایی بوهای بد کد (Code Smells) و کاتالوگ تکنیک‌های گام‌به‌گام بدون تغییر رفتار بیرونی.',
      createdAt: now,
    },
    {
      id: 'bk_ddia',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      topic: 'سیستم‌های توزیع‌شده و داده',
      description:
        'مبانی قابلیت اطمینان، مقیاس‌پذیری و نگهداری‌پذیری در سیستم‌های داده‌محور مدرن، موتورهای ذخیره‌سازی و معماری توزیع‌شده.',
      createdAt: now,
    },
  ];

  const chapters: Chapter[] = [
    {
      id: 'ch_posd_1',
      bookId: 'bk_posd',
      title: 'Chapter 2: The Nature of Complexity',
      description:
        'تعریف پیچیدگی، نشانه‌های سه‌گانه پیچیدگی (Change Amplification، Cognitive Load، Unknown Unknowns) و ریشه‌های آن.',
      orderIndex: 1,
      quizQuestionCount: 4,
      createdAt: now,
    },
    {
      id: 'ch_posd_2',
      bookId: 'bk_posd',
      title: 'Chapter 4: Modules Should Be Deep',
      description:
        'تفاوت ماژول‌های عمیق (Deep) و کم‌عمق (Shallow)، هزینه انتزاع و نسبت سادگی رابط به قدرت پیاده‌سازی.',
      orderIndex: 2,
      quizQuestionCount: 4,
      createdAt: now,
    },
    {
      id: 'ch_posd_3',
      bookId: 'bk_posd',
      title: 'Chapter 5: Information Hiding (and Leakage)',
      description:
        'پنهان‌سازی تصمیمات طراحی داخل یک ماژول، جلوگیری از نشت اطلاعات و خطای تجزیه زمانی (Temporal Decomposition).',
      orderIndex: 3,
      quizQuestionCount: 3,
      createdAt: now,
    },
    {
      id: 'ch_ref_1',
      bookId: 'bk_refactoring',
      title: 'Chapter 2: Principles in Refactoring',
      description:
        'قاعده دو کلاه (Two Hats)، زمان مناسب برای بازآرایی، نقش تست‌های خودکار و ارتباط Refactoring با کارایی.',
      orderIndex: 1,
      quizQuestionCount: 4,
      createdAt: now,
    },
    {
      id: 'ch_ref_2',
      bookId: 'bk_refactoring',
      title: 'Chapter 3: Bad Smells in Code',
      description:
        'شناسایی نشانه‌های نیاز به بازآرایی مانند Long Function، Feature Envy، Divergent Change و Shotgun Surgery.',
      orderIndex: 2,
      quizQuestionCount: 4,
      createdAt: now,
    },
    {
      id: 'ch_ddia_1',
      bookId: 'bk_ddia',
      title: 'Chapter 1: Reliable, Scalable, and Maintainable Applications',
      description:
        'تفاوت Fault و Failure، صدک‌های تأخیر (p95/p99)، پارامترهای بار و اصول قابلیت نگهداری سیستم‌های داده‌محور.',
      orderIndex: 1,
      quizQuestionCount: 3,
      createdAt: now,
    },
  ];

  const questions: Question[] = [
    // POSD Chapter 1 (7 questions, exam picks 4)
    {
      id: 'q_posd1_1',
      chapterId: 'ch_posd_1',
      question: 'According to John Ousterhout, which symptom of complexity is considered the worst?',
      answers: [
        'Change amplification',
        'High cognitive load',
        'Unknown unknowns',
        'Excessive code comments',
      ],
      correctIndex: 2,
      createdAt: now,
    },
    {
      id: 'q_posd1_2',
      chapterId: 'ch_posd_1',
      question: 'What are the two fundamental causes of software complexity identified in Chapter 2?',
      answers: [
        'Inheritance and polymorphism',
        'Dependencies and obscurity',
        'Concurrency and memory allocation',
        'Long functions and short variable names',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd1_3',
      chapterId: 'ch_posd_1',
      question: 'What does "change amplification" mean?',
      answers: [
        'A seemingly simple change requires code modifications in many different places',
        'A small refactor dramatically improves runtime throughput',
        'Unit tests run slower as the codebase grows',
        'Multiple developers edit the same pull request simultaneously',
      ],
      correctIndex: 0,
      createdAt: now,
    },
    {
      id: 'q_posd1_4',
      chapterId: 'ch_posd_1',
      question: 'Why does Ousterhout argue that complexity is incremental?',
      answers: [
        'It only appears after migrating to microservices',
        'It accumulates from hundreds of small dependencies and obscurities over time',
        'It is introduced solely by junior developers',
        'It disappears automatically once a framework is upgraded',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd1_5',
      chapterId: 'ch_posd_1',
      question: 'Which statement best describes "cognitive load" in software engineering?',
      answers: [
        'The CPU utilization of a compiled binary under peak traffic',
        'How much a developer needs to know in order to complete a task',
        'The total number of lines of code in a repository',
        'The time required to run a full CI/CD pipeline',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd1_6',
      chapterId: 'ch_posd_1',
      question: 'When is a piece of code considered "obvious" according to the book?',
      answers: [
        'When it uses the fewest possible characters on each line',
        'When a developer can read it quickly and their first guesses about its behavior are correct',
        'When it contains zero helper functions',
        'When it relies exclusively on dynamic typing',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd1_7',
      chapterId: 'ch_posd_1',
      question: 'Why are "unknown unknowns" particularly dangerous when modifying a system?',
      answers: [
        'They cause immediate syntax errors in the IDE',
        'You cannot tell which pieces of code must be modified or what hidden assumptions you might break',
        'They prevent TypeScript from compiling',
        'They force every function to become asynchronous',
      ],
      correctIndex: 1,
      createdAt: now,
    },

    // POSD Chapter 2 (6 questions, exam picks 4)
    {
      id: 'q_posd2_1',
      chapterId: 'ch_posd_2',
      question: 'How does Ousterhout define a "deep module"?',
      answers: [
        'A module nested at least four directories deep',
        'A module that provides powerful functionality through a simple interface',
        'A class with a deep inheritance hierarchy of five or more subclasses',
        'A module with many small public methods',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd2_2',
      chapterId: 'ch_posd_2',
      question: 'Which classic example does the book praise as an outstanding deep module?',
      answers: [
        'Java BufferedInputStream + FileInputStream boilerplate',
        'The Unix file I/O interface (open, read, write, lseek, close)',
        'A one-line wrapper class around a linked list',
        'A getter-only data transfer object',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd2_3',
      chapterId: 'ch_posd_2',
      question: 'What is "classitis" as criticized by John Ousterhout?',
      answers: [
        'Using functional programming instead of classes',
        'The syndrome of creating lots of tiny, shallow classes that increase interface complexity without hiding much',
        'Forgetting to add constructors to TypeScript classes',
        'Putting all application logic into a single global singleton',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd2_4',
      chapterId: 'ch_posd_2',
      question: 'What is the main drawback of a "shallow module"?',
      answers: [
        'Its interface is relatively complex compared to the small amount of functionality it provides',
        'It runs slower than a deep module at runtime',
        'It cannot be tested with unit tests',
        'It always causes memory leaks in garbage-collected languages',
      ],
      correctIndex: 0,
      createdAt: now,
    },
    {
      id: 'q_posd2_5',
      chapterId: 'ch_posd_2',
      question: 'What constitutes the "interface" of a module in Ousterhout’s view?',
      answers: [
        'Only the method signatures checked by the compiler',
        'Both formal signatures and informal knowledge such as side effects, constraints, and ordering rules',
        'Only the exported TypeScript interface keyword declarations',
        'The private fields inside the class body',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd2_6',
      chapterId: 'ch_posd_2',
      question: 'What is the primary purpose of an abstraction in software design?',
      answers: [
        'To omit unimportant details while preserving what is essential to use a component',
        'To hide every detail including critical performance constraints',
        'To maximize the total number of layers in an architecture',
        'To make code reusable even if it becomes harder to understand',
      ],
      correctIndex: 0,
      createdAt: now,
    },

    // POSD Chapter 3 (5 questions, exam picks 3)
    {
      id: 'q_posd3_1',
      chapterId: 'ch_posd_3',
      question: 'What is "information leakage" according to Chapter 5?',
      answers: [
        'Exposing API keys in client-side bundles',
        'When knowledge of a design decision is reflected in multiple modules, creating dependencies between them',
        'Sending unencrypted traffic over HTTP',
        'Caching user profiles in memory',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd3_2',
      chapterId: 'ch_posd_3',
      question: 'What is "temporal decomposition" and why is it a red flag?',
      answers: [
        'Structuring modules strictly by the order in which operations happen at runtime, which often splits related knowledge across modules',
        'Scheduling cron jobs across multiple time zones',
        'Deleting old records based on timestamp expiration',
        'Separating synchronous code from async/await functions',
      ],
      correctIndex: 0,
      createdAt: now,
    },
    {
      id: 'q_posd3_3',
      chapterId: 'ch_posd_3',
      question: 'How can you often fix information leakage between two modules that both know a file format?',
      answers: [
        'Duplicate the parsing helper in both modules',
        'Combine them into a single deeper module or extract a dedicated module that encapsulates that knowledge',
        'Add more comments explaining the file format in both places',
        'Make all internal fields public so both modules can inspect them',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd3_4',
      chapterId: 'ch_posd_3',
      question: 'Which approach best exemplifies good information hiding for HTTP request parsing?',
      answers: [
        'Reading raw bytes in one class and parsing headers in three separate caller classes',
        'Encapsulating socket reading and HTTP protocol parsing inside a cohesive HTTP request module',
        'Exposing internal buffer offsets to every route handler',
        'Requiring callers to manually validate CRLF line endings before invoking the parser',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_posd3_5',
      chapterId: 'ch_posd_3',
      question: 'Does marking variables "private" automatically guarantee good information hiding?',
      answers: [
        'Yes, private fields completely eliminate information leakage',
        'No, information can still leak through interfaces, getters/setters, or duplicated assumptions across modules',
        'Yes, as long as the language is statically typed',
        'Only when combined with singleton classes',
      ],
      correctIndex: 1,
      createdAt: now,
    },

    // Refactoring Chapter 1 (6 questions, exam picks 4)
    {
      id: 'q_ref1_1',
      chapterId: 'ch_ref_1',
      question: 'What is Martin Fowler’s definition of refactoring (as a verb)?',
      answers: [
        'Rewriting an application from scratch in a newer framework',
        'Restructuring software by applying behavior-preserving transformations to make it easier to understand and cheaper to modify',
        'Optimizing hot loops to reduce memory allocation by 50%',
        'Fixing production bugs discovered by end users',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref1_2',
      chapterId: 'ch_ref_1',
      question: 'What does Kent Beck’s "Two Hats" metaphor advise developers to do?',
      answers: [
        'Simultaneously refactor architecture and add new features in the same edit',
        'Swap deliberately between adding functionality and refactoring, never doing both at the exact same moment',
        'Assign one developer to write code and another to delete code',
        'Maintain two separate Git repositories for staging and production',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref1_3',
      chapterId: 'ch_ref_1',
      question: 'What is the "Rule of Three" mentioned for deciding when to refactor?',
      answers: [
        'Never create more than three classes per module',
        'First time you just do it; second time you wince and duplicate; third time you do something similar, you refactor',
        'Every function should have at least three unit tests',
        'Code reviews require three approvals before merging',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref1_4',
      chapterId: 'ch_ref_1',
      question: 'What is the essential prerequisite before performing significant refactoring safely?',
      answers: [
        'A solid suite of self-checking automated tests',
        'Complete UML sequence diagrams for every module',
        'Freezing all product releases for one month',
        'Migrating the database to a new schema first',
      ],
      correctIndex: 0,
      createdAt: now,
    },
    {
      id: 'q_ref1_5',
      chapterId: 'ch_ref_1',
      question: 'How does Fowler describe the relationship between refactoring and performance?',
      answers: [
        'Refactoring always makes software permanently slower',
        'Clean, well-factored code makes profiling and tuning the small performance-critical hot spots much easier',
        'You should optimize every loop before extracting helper functions',
        'Performance tuning and refactoring are identical activities',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref1_6',
      chapterId: 'ch_ref_1',
      question: 'When does Fowler suggest NOT refactoring a piece of existing code?',
      answers: [
        'When the code is ugly but hidden behind an API and never needs to be modified, or when rewriting from scratch is genuinely easier',
        'Whenever a sprint has a tight deadline',
        'Whenever a function is shorter than 50 lines',
        'Whenever the code was written by another team',
      ],
      correctIndex: 0,
      createdAt: now,
    },

    // Refactoring Chapter 2 (6 questions, exam picks 4)
    {
      id: 'q_ref2_1',
      chapterId: 'ch_ref_2',
      question: 'Which code smell occurs when a function communicates far more with data in another module than with its own?',
      answers: [
        'Shotgun Surgery',
        'Feature Envy',
        'Speculative Generality',
        'Refused Bequest',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref2_2',
      chapterId: 'ch_ref_2',
      question: 'How do "Divergent Change" and "Shotgun Surgery" differ?',
      answers: [
        'Divergent Change is one module changed for many unrelated reasons; Shotgun Surgery is one change requiring tiny edits across many modules',
        'Divergent Change applies only to CSS; Shotgun Surgery applies only to SQL',
        'They are two names for the exact same code smell',
        'Shotgun Surgery happens when a single file is too large',
      ],
      correctIndex: 0,
      createdAt: now,
    },
    {
      id: 'q_ref2_3',
      chapterId: 'ch_ref_2',
      question: 'What is "Primitive Obsession"?',
      answers: [
        'Using low-level languages like C for web apps',
        'Over-relying on primitive types (strings/numbers) instead of small domain objects like Money, DateRange, or PhoneNumber',
        'Writing unit tests without mocking frameworks',
        'Avoiding generics in TypeScript',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref2_4',
      chapterId: 'ch_ref_2',
      question: 'What does the "Data Clumps" smell refer to?',
      answers: [
        'Storing JSON blobs in a relational column',
        'Groups of three or four data items that repeatedly appear together in fields and parameter lists and should become their own object',
        'Database tables with too many rows',
        'Caching API responses in browser localStorage',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref2_5',
      chapterId: 'ch_ref_2',
      question: 'What is "Speculative Generality"?',
      answers: [
        'Writing generic tests for edge cases',
        'Adding hooks, abstractions, and special cases for hypothetical future requirements that are not actually needed today',
        'Using TypeScript interfaces for API responses',
        'Extracting repeated code into a shared utility',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ref2_6',
      chapterId: 'ch_ref_2',
      question: 'When a comment is written solely to explain a confusing block of code, what refactoring does Fowler often recommend first?',
      answers: [
        'Expand the comment into a multi-paragraph docstring',
        'Use Extract Function and Rename so the code explains its own intent clearly',
        'Delete the comment without changing the code',
        'Move the code into a separate microservice',
      ],
      correctIndex: 1,
      createdAt: now,
    },

    // DDIA Chapter 1 (5 questions, exam picks 3)
    {
      id: 'q_ddia1_1',
      chapterId: 'ch_ddia_1',
      question: 'In DDIA Chapter 1, what is the key distinction between a "fault" and a "failure"?',
      answers: [
        'A fault is one component deviating from its spec; a failure is when the system as a whole stops providing the required service to users',
        'A fault is a software bug; a failure is always a hardware outage',
        'Faults cannot be tolerated, whereas failures are expected daily',
        'They are interchangeable terms in distributed systems',
      ],
      correctIndex: 0,
      createdAt: now,
    },
    {
      id: 'q_ddia1_2',
      chapterId: 'ch_ddia_1',
      question: 'Why does Martin Kleppmann recommend measuring tail latency (p95, p99) instead of only average response time?',
      answers: [
        'Averages are harder to calculate in SQL',
        'Averages hide how badly slow requests affect the most active users, especially with fan-out tail latency amplification',
        'Tail latencies are always lower than the median',
        'p99 ignores network errors completely',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ddia1_3',
      chapterId: 'ch_ddia_1',
      question: 'Which three design principles does Kleppmann highlight for Maintainability?',
      answers: [
        'Availability, Consistency, Partition Tolerance',
        'Operability, Simplicity, Evolvability',
        'Encapsulation, Inheritance, Polymorphism',
        'Latency, Throughput, Bandwidth',
      ],
      correctIndex: 1,
      createdAt: now,
    },
    {
      id: 'q_ddia1_4',
      chapterId: 'ch_ddia_1',
      question: 'What is "tail latency amplification" in a backend service?',
      answers: [
        'When a single user request fans out to multiple backend calls, waiting for the slowest one makes slow responses much more likely',
        'When log files grow larger over time and fill disk space',
        'When a database index speeds up read queries',
        'When DNS TTL values expire simultaneously',
      ],
      correctIndex: 0,
      createdAt: now,
    },
    {
      id: 'q_ddia1_5',
      chapterId: 'ch_ddia_1',
      question: 'In Twitter’s home timeline case study from Chapter 1, what made fan-out-on-write tricky for celebrity accounts?',
      answers: [
        'Celebrities could not authenticate via OAuth',
        'A single tweet from a user with millions of followers triggered millions of timeline cache writes',
        'Tweets exceeded the 64KB relational row size',
        'Read queries became completely unnecessary',
      ],
      correctIndex: 1,
      createdAt: now,
    },
  ];

  return { users, books, chapters, questions };
}
