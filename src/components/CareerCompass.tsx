import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  Compass,
  Sparkles,
  BrainCircuit,
  Database,
  Code2,
  ShieldAlert,
  Cpu,
  Calculator,
  Award,
  BookCheck,
} from 'lucide-react';
import { Course, PLODefinition } from '../types/academic';

interface CareerCompassProps {
  courses: Course[];
  radarCompetencies: Array<{
    id: string;
    subject: string;
    shortName: string;
    score: number;
    fullMark: number;
    badge: string;
    evidence: string;
  }>;
  selectedInterests: string[];
  onToggleInterest: (interestId: string) => void;
  ploDefinitions: PLODefinition[];
  onToggleCourseCompleted: (code: string, completed: boolean, defaultScore10?: number) => void;
}

export const INTEREST_OPTIONS = [
  {
    id: 'ai_nlp',
    label: 'Trí tuệ nhân tạo, Học sâu & Xử lý ngôn ngữ tự nhiên (AI / NLP / Computer Vision)',
    icon: BrainCircuit,
    short: 'Trí tuệ nhân tạo & NLP',
  },
  {
    id: 'data_science',
    label: 'Khoa học dữ liệu, Khai phá dữ liệu & Phân tích thống kê nhiều chiều (Data Science)',
    icon: Database,
    short: 'Khoa học dữ liệu & Thống kê',
  },
  {
    id: 'applied_math',
    label: 'Mô hình hóa Toán học, Giải tích số & Tối ưu hóa (Scientific Computing & Quant)',
    icon: Calculator,
    short: 'Nghiên cứu Toán ứng dụng & Quant',
  },
  {
    id: 'web_app',
    label: 'Phát triển Web/Mobile Full-Stack & Kỹ nghệ phần mềm (Software Engineering)',
    icon: Code2,
    short: 'Phát triển Web/App & PTPM',
  },
  {
    id: 'cyber_security',
    label: 'Mật mã học, An toàn dữ liệu & Bảo mật hệ thống Linux (Cybersecurity)',
    icon: ShieldAlert,
    short: 'An toàn thông tin & Mật mã',
  },
  {
    id: 'embedded_iot',
    label: 'Hệ thống nhúng, IoT & Tính toán song song hiệu năng cao (Embedded & HPC)',
    icon: Cpu,
    short: 'Hệ thống nhúng, IoT & HPC',
  },
];

export const CareerCompass: React.FC<CareerCompassProps> = ({
  courses,
  radarCompetencies,
  selectedInterests,
  onToggleInterest,
  ploDefinitions,
  onToggleCourseCompleted,
}) => {
  const [subTab, setSubTab] = useState<'radar_interests' | 'career_packages' | 'plo_reference'>(
    'radar_interests'
  );

  const careerTracks = useMemo(() => {
    const getAxisScore = (id: string) =>
      radarCompetencies.find((r) => r.id === id)?.score || 8.0;

    const math = getAxisScore('math_modeling');
    const prob = getAxisScore('prob_stats');
    const data = getAxisScore('data_linux');
    const eng = getAxisScore('english');
    const algo = getAxisScore('algo_discrete');
    const swe = getAxisScore('swe_os');

    const tracks = [
      {
        id: 'ai_nlp_scientist',
        title: 'Chuyên gia Trí tuệ Nhân tạo, Học máy & NLP / Computer Vision (AI Engineer / Researcher)',
        interestKeys: ['ai_nlp', 'applied_math'],
        baseAcademicFit: Math.round(((math * 0.3 + prob * 0.3 + eng * 0.25 + algo * 0.15) / 10) * 100),
        ploCodes: ['PK2', 'PK6', 'PS2', 'PS3', 'PS5'],
        whyFit:
          'Phát huy trọn vẹn điểm tuyệt đối Giải tích 1, 2, 3 (8.7, 8.7, 10.0), Xác suất thống kê (8.8 A), Cơ sở dữ liệu (8.5 A) và Tiếng Anh chuyên ngành (8.0 B+) kết hợp 2 môn Trí tuệ nhân tạo + Học máy đang học ở Kỳ 5.',
        electiveV21: ['MAT3519', 'MAT3558'],
        electiveV22: ['MAT3561E', 'MAT3562E', 'MAT3534', 'MAT3538'],
        graduationRec: 'MAT4080 - Khóa luận tốt nghiệp (7 TC) về Mô hình Ngôn ngữ / Thị giác máy tính hoặc Học máy thống kê',
      },
      {
        id: 'data_scientist',
        title: 'Kỹ sư Khoa học Dữ liệu, Phân tích Định lượng & Khai phá Dữ liệu (Data Scientist / Quant Analyst)',
        interestKeys: ['data_science', 'applied_math'],
        baseAcademicFit: Math.round(((prob * 0.35 + data * 0.25 + math * 0.25 + eng * 0.15) / 10) * 100),
        ploCodes: ['PK2', 'PK3', 'PK6', 'PS2', 'PS3'],
        whyFit:
          'Khớp hoàn hảo với cặp điểm A ở Xác suất thống kê (8.8), Cơ sở dữ liệu (8.5), Nhập môn Phân tích dữ liệu (8.4 B+) và Phương trình vi phân (8.5 A). Ít bị phụ thuộc vào điểm trũng OOP (5.4).',
        electiveV21: ['MAT3519', 'MAT3558'],
        electiveV22: ['MAT3534', 'MAT3452', 'MAT3453', 'MAT3535'],
        graduationRec: 'MAT4080 - Khóa luận tốt nghiệp (7 TC) về Khai phá dữ liệu lớn & Mô hình thống kê nhiều chiều',
      },
      {
        id: 'crypto_security',
        title: 'Chuyên gia Mật mã học, An toàn Dữ liệu & Quản trị Hệ thống Linux (Security & Cryptography Specialist)',
        interestKeys: ['cyber_security', 'applied_math'],
        baseAcademicFit: Math.round(((data * 0.35 + math * 0.25 + algo * 0.25 + eng * 0.15) / 10) * 100),
        ploCodes: ['PK2', 'PK4', 'PS1', 'PS2'],
        whyFit:
          'Tận dụng điểm A môn Môi trường lập trình Linux (8.7), Toán rời rạc (7.0), Đại số tuyến tính (7.1) và Mạng máy tính đang học ở Kỳ 5.',
        electiveV21: ['MAT3519', 'MAT1208'],
        electiveV22: ['MAT3539', 'MAT3148', 'MAT3534', 'MAT2034'],
        graduationRec: 'Học phần thay thế KLTN (MAT1203 + MAT3377) hoặc KLTN về Mật mã & An toàn dữ liệu',
      },
      {
        id: 'fullstack_ai_swe',
        title: 'Kỹ sư Phát triển Ứng dụng Web/Mobile Tích hợp AI (AI-Powered Full-Stack Software Engineer)',
        interestKeys: ['web_app', 'ai_nlp'],
        baseAcademicFit: Math.round(((data * 0.3 + swe * 0.3 + algo * 0.2 + eng * 0.2) / 10) * 100),
        ploCodes: ['PK3', 'PK5', 'PS1', 'PS3', 'PS4'],
        whyFit:
          'Dựa trên nền Cơ sở dữ liệu (8.5 A) vững chắc. Khuyên bạn nên học cải thiện môn Lập trình hướng đối tượng (MAT1202 - hiện tại D+ 5.4) trước khi học Thực tập PTPM & Công nghệ phần mềm.',
        electiveV21: ['MAT3558', 'MAT3560'],
        electiveV22: ['MAT3542', 'MAT3561E', 'MAT3535', 'MAT3534'],
        graduationRec: 'Phương án học phần thay thế (MAT1203 - Phân tích TK HTTT 4 TC + MAT3377 - Chuyên đề AI 3 TC)',
      },
    ];

    return tracks
      .map((t) => {
        const interestBonus = t.interestKeys.some((k) => selectedInterests.includes(k)) ? 9 : 0;
        const matchScore = Math.min(t.baseAcademicFit + interestBonus, 98);
        return { ...t, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [radarCompetencies, selectedInterests]);

  const courseMap = useMemo(() => {
    const m: Record<string, Course> = {};
    courses.forEach((c) => {
      m[c.code] = c;
    });
    return m;
  }, [courses]);

  return (
    <div className="space-y-4">
      {/* Sub-Navigation Pills */}
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-2 border border-sky-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSubTab('radar_interests')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            subTab === 'radar_interests'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>1. Biểu Đồ Radar 6 Trục Năng Lực & Sở Thích</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('career_packages')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            subTab === 'career_packages'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>2. Đề Xuất Chuyên Ngành & Gói Tự Chọn 16 TC</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('plo_reference')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            subTab === 'plo_reference'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
          }`}
        >
          <BookCheck className="w-4 h-4" />
          <span>3. Chuẩn Đầu Ra QĐ 3568 (PK1-PK6, PS1-PS6)</span>
        </button>
      </div>

      {subTab === 'radar_interests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-600" />
                Biểu đồ Radar Năng lực 6 Trục
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tính toán tự động từ điểm thực tế của Phạm Ngọc Huân
              </p>
            </div>

            <div className="h-[300px] w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="74%" data={radarCompetencies}>
                  <PolarGrid stroke="#bae6fd" />
                  <PolarAngleAxis
                    dataKey="shortName"
                    tick={{ fill: '#0369a1', fontSize: 11, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Điểm năng lực (/10)"
                    dataKey="score"
                    stroke="#0284c7"
                    strokeWidth={3}
                    fill="#38bdf8"
                    fillOpacity={0.45}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} / 10.0`, 'Điểm năng lực']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #38bdf8' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200/70 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              💡 <strong>Nhận định Chuyên gia:</strong> Thế mạnh mũi nhọn của Huân là{' '}
              <strong className="text-sky-700 dark:text-sky-300">
                Toán Giải tích (9.1) — Ngoại ngữ (9.0) — Xác suất & Dữ liệu (8.6)
              </strong>
              , cực kỳ phù hợp với hướng <strong>AI / Machine Learning / Data Science</strong>.
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-sky-600" />
                Chi tiết 6 Trục Năng lực Học thuật
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {radarCompetencies.map((item) => {
                  const isHigh = item.score >= 8.5;
                  const isLow = item.score < 6.8;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isHigh
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
                          : isLow
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/70'
                          : 'bg-sky-50/50 dark:bg-slate-800/60 border-sky-100 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.subject}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                            isHigh
                              ? 'bg-emerald-600 text-white'
                              : isLow
                              ? 'bg-amber-500 text-white'
                              : 'bg-sky-600 text-white'
                          }`}
                        >
                          {item.score}/10
                        </span>
                      </div>
                      <div className="text-[11px] font-extrabold text-sky-700 dark:text-sky-400 mb-0.5">
                        ★ {item.badge}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                        {item.evidence}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Chọn Sở thích Nghề nghiệp (Click để lọc gói tự chọn)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INTEREST_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = selectedInterests.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onToggleInterest(opt.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                        active
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{opt.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'career_packages' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {careerTracks.map((track, idx) => (
            <div
              key={track.id}
              className={`rounded-2xl p-5 border-2 transition-all bg-white dark:bg-slate-900 shadow-sm ${
                idx === 0
                  ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/15'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  {idx === 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white mb-1.5">
                      <Sparkles className="w-3 h-3" />
                      ĐỀ XUẤT SỐ 1 CHO PHẠM NGỌC HUÂN
                    </span>
                  )}
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {track.title}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                    {track.matchScore}%
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Độ khớp</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 p-3 rounded-xl bg-sky-50/70 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700">
                🎯 {track.whyFit}
              </p>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                    1. Gói Tự chọn Kỹ năng Phần mềm V.2.1 (4/8 TC):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {track.electiveV21.map((code) => {
                      const c = courseMap[code];
                      if (!c) return null;
                      return (
                        <div
                          key={code}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400">
                              {c.code} ({c.credits} TC)
                            </div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                              {c.name_vi}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                            {c.in_progress ? 'Đang học K5' : 'Gợi ý'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                    2. Gói Tự chọn Chuyên sâu AI & PTPM V.2.2 (12/39 TC):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {track.electiveV22.map((code) => {
                      const c = courseMap[code];
                      if (!c) return null;
                      return (
                        <div
                          key={code}
                          className="p-2.5 rounded-xl border border-sky-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800/50 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400">
                              {c.code} ({c.credits} TC)
                            </div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                              {c.name_vi}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'plo_reference' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">
            Bảng Tham chiếu Chuẩn Đầu Ra Chương trình Đào tạo (PK1-PK6 & PS1-PS6 theo QĐ 3568/QĐ-ĐHKHTN)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {ploDefinitions.map((plo) => (
              <div
                key={plo.code}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5"
              >
                <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-mono font-bold text-[11px] shrink-0">
                  {plo.code}
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  {plo.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
