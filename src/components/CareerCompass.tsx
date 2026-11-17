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
  BrainCircuit,
  Database,
  Code2,
  ShieldAlert,
  Cpu,
  Calculator,
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
    label: 'Trí tuệ nhân tạo, Học sâu và Xử lý ngôn ngữ tự nhiên (AI / NLP / CV)',
    icon: BrainCircuit,
    short: 'Trí tuệ nhân tạo và NLP',
  },
  {
    id: 'data_science',
    label: 'Khoa học dữ liệu, Khai phá dữ liệu và Phân tích thống kê (Data Science)',
    icon: Database,
    short: 'Khoa học dữ liệu và Thống kê',
  },
  {
    id: 'applied_math',
    label: 'Mô hình hóa Toán học, Giải tích số và Tối ưu hóa (Quant)',
    icon: Calculator,
    short: 'Toán ứng dụng và Tối ưu hóa',
  },
  {
    id: 'web_app',
    label: 'Phát triển Web/Mobile Full-Stack và Kỹ nghệ phần mềm',
    icon: Code2,
    short: 'Phát triển Web/App và PTPM',
  },
  {
    id: 'cyber_security',
    label: 'Mật mã học, An toàn dữ liệu và Quản trị Linux',
    icon: ShieldAlert,
    short: 'An toàn thông tin và Mật mã',
  },
  {
    id: 'embedded_iot',
    label: 'Hệ thống nhúng, IoT và Tính toán hiệu năng cao',
    icon: Cpu,
    short: 'Hệ thống nhúng và HPC',
  },
];

export const CareerCompass: React.FC<CareerCompassProps> = ({
  courses,
  radarCompetencies,
  selectedInterests,
  onToggleInterest,
  ploDefinitions,
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
        title: 'Kỹ sư và Nghiên cứu viên AI, Học máy, NLP / Thị giác máy tính',
        interestKeys: ['ai_nlp', 'applied_math'],
        baseAcademicFit: Math.round(((math * 0.3 + prob * 0.3 + eng * 0.25 + algo * 0.15) / 10) * 100),
        ploCodes: ['PK2', 'PK6', 'PS2', 'PS3', 'PS5'],
        whyFit:
          'Phát huy trọn vẹn điểm Giải tích 1, 2, 3 (8.7, 8.7, 10.0), Xác suất thống kê (8.8 A), Cơ sở dữ liệu (8.5 A) và Tiếng Anh chuyên ngành (8.0 B+) kết hợp hai môn Trí tuệ nhân tạo và Học máy đang học ở Kỳ 5.',
        electiveV21: ['MAT3519', 'MAT3558'],
        electiveV22: ['MAT3561E', 'MAT3562E', 'MAT3534', 'MAT3538'],
        graduationRec:
          'MAT4080 · Khóa luận tốt nghiệp (7 TC) về Xử lý ngôn ngữ tự nhiên hoặc Học máy thống kê',
      },
      {
        id: 'data_scientist',
        title: 'Kỹ sư Khoa học Dữ liệu và Phân tích Định lượng (Data Science / Quant)',
        interestKeys: ['data_science', 'applied_math'],
        baseAcademicFit: Math.round(((prob * 0.35 + data * 0.25 + math * 0.25 + eng * 0.15) / 10) * 100),
        ploCodes: ['PK2', 'PK3', 'PK6', 'PS2', 'PS3'],
        whyFit:
          'Khớp với kết quả Xác suất thống kê (8.8 A), Cơ sở dữ liệu (8.5 A), Nhập môn phân tích dữ liệu (8.4 B+) và Phương trình vi phân (8.5 A). Ít phụ thuộc vào điểm OOP (5.4).',
        electiveV21: ['MAT3519', 'MAT3558'],
        electiveV22: ['MAT3534', 'MAT3452', 'MAT3453', 'MAT3535'],
        graduationRec:
          'MAT4080 · Khóa luận tốt nghiệp (7 TC) về Khai phá dữ liệu lớn và Mô hình thống kê nhiều chiều',
      },
      {
        id: 'crypto_security',
        title: 'Chuyên gia Mật mã học, An toàn Dữ liệu và Hệ thống Linux',
        interestKeys: ['cyber_security', 'applied_math'],
        baseAcademicFit: Math.round(((data * 0.35 + math * 0.25 + algo * 0.25 + eng * 0.15) / 10) * 100),
        ploCodes: ['PK2', 'PK4', 'PS1', 'PS2'],
        whyFit:
          'Tận dụng điểm A môn Môi trường lập trình Linux (8.7), Toán rời rạc (7.0), Đại số tuyến tính (7.1) và Mạng máy tính đang học ở Kỳ 5.',
        electiveV21: ['MAT3519', 'MAT1208'],
        electiveV22: ['MAT3539', 'MAT3148', 'MAT3534', 'MAT2034'],
        graduationRec:
          'Học phần thay thế KLTN (MAT1203 + MAT3377) hoặc Khóa luận về Mật mã và An toàn dữ liệu',
      },
      {
        id: 'fullstack_ai_swe',
        title: 'Kỹ sư Phát triển Ứng dụng Web/Mobile Tích hợp AI',
        interestKeys: ['web_app', 'ai_nlp'],
        baseAcademicFit: Math.round(((data * 0.3 + swe * 0.3 + algo * 0.2 + eng * 0.2) / 10) * 100),
        ploCodes: ['PK3', 'PK5', 'PS1', 'PS3', 'PS4'],
        whyFit:
          'Dựa trên nền Cơ sở dữ liệu (8.5 A). Nên học cải thiện môn Lập trình hướng đối tượng (MAT1202 · D+ 5.4) trước khi học Thực tập phát triển phần mềm và Công nghệ phần mềm.',
        electiveV21: ['MAT3558', 'MAT3560'],
        electiveV22: ['MAT3542', 'MAT3561E', 'MAT3535', 'MAT3534'],
        graduationRec:
          'Học phần thay thế (MAT1203 · Phân tích TK HTTT 4 TC + MAT3377 · Chuyên đề AI 3 TC)',
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
    <div className="space-y-5">
      {/* Quiet Segmented Navigation */}
      <div className="inline-flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setSubTab('radar_interests')}
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
            subTab === 'radar_interests'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Compass className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
          <span>Năng lực 6 trục và sở thích</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('career_packages')}
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
            subTab === 'career_packages'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
          <span>Hướng chuyên ngành và gói tự chọn 16 TC</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('plo_reference')}
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
            subTab === 'plo_reference'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <BookCheck className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
          <span>Chuẩn đầu ra QĐ 3568</span>
        </button>
      </div>

      {subTab === 'radar_interests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Biểu đồ năng lực 6 trục
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tổng hợp từ điểm số thực tế các nhóm học phần
              </p>
            </div>

            <div className="h-[300px] w-full my-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarCompetencies}>
                  <PolarGrid stroke="#e4e4e7" />
                  <PolarAngleAxis
                    dataKey="shortName"
                    tick={{ fill: '#52525b', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 10]}
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                  />
                  <Radar
                    name="Điểm năng lực (/10)"
                    dataKey="score"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="#0284c7"
                    fillOpacity={0.14}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} / 10.0`, 'Năng lực']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Thế mạnh nổi bật:</span>{' '}
              Toán Giải tích (9.1), Ngoại ngữ (9.0) và Xác suất · Dữ liệu (8.6), phù hợp với định hướng AI, Học máy và Khoa học dữ liệu.
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Chi tiết 6 trục năng lực học thuật
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {radarCompetencies.map((item) => {
                  const isHigh = item.score >= 8.5;
                  const isLow = item.score < 6.8;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isHigh ? 'bg-emerald-600' : isLow ? 'bg-amber-600' : 'bg-sky-600'
                            }`}
                          />
                          <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {item.subject}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">
                          {item.score.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 pl-4 mb-0.5">
                        {item.badge}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-4 leading-snug">
                        {item.evidence}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Sở thích nghề nghiệp (chọn để ưu tiên gói môn tự chọn)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INTEREST_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = selectedInterests.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onToggleInterest(opt.id)}
                      className={`h-10 px-3 rounded-lg border text-left text-xs font-medium flex items-center gap-2.5 transition-colors duration-150 ${
                        active
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        strokeWidth={1.5}
                      />
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
              className={`rounded-xl p-6 border bg-white dark:bg-zinc-900 ${
                idx === 0
                  ? 'border-sky-600/50 dark:border-sky-500/50'
                  : 'border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  {idx === 0 && (
                    <span className="inline-block text-[11px] font-medium text-sky-700 dark:text-sky-400 mb-1">
                      Phù hợp nhất theo hồ sơ hiện tại
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {track.title}
                  </h3>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <div className="text-2xl font-medium font-mono text-zinc-900 dark:text-zinc-100">
                    {track.matchScore}%
                  </div>
                  <div className="text-[11px] text-zinc-500">Độ khớp</div>
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800">
                {track.whyFit}
              </p>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Tự chọn Kỹ năng phần mềm V.2.1 (chọn 4/8 TC)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {track.electiveV21.map((code) => {
                      const c = courseMap[code];
                      if (!c) return null;
                      return (
                        <div
                          key={code}
                          className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-xs text-zinc-500 tabular-nums">
                              {c.code} · {c.credits} TC
                            </div>
                            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {c.name_vi}
                            </div>
                          </div>
                          {c.in_progress && (
                            <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 shrink-0">
                              K5
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Tự chọn chuyên sâu AI và PTPM V.2.2 (chọn 12/39 TC)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {track.electiveV22.map((code) => {
                      const c = courseMap[code];
                      if (!c) return null;
                      return (
                        <div
                          key={code}
                          className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
                        >
                          <div className="font-mono text-xs text-zinc-500 tabular-nums">
                            {c.code} · {c.credits} TC
                          </div>
                          <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {c.name_vi}
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
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Chuẩn đầu ra chương trình đào tạo theo QĐ 3568
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {ploDefinitions.map((plo) => (
              <div
                key={plo.code}
                className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 flex items-start gap-2.5"
              >
                <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono font-medium text-[11px] shrink-0">
                  {plo.code}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 leading-snug">{plo.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
