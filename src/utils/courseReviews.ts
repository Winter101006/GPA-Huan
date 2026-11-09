export interface CourseDifficultyInfo {
  stars: number; // 0 to 5 (e.g., 2, 3, 3.5, 4, 4.5, 5)
  levelLabel: string; // 'Dễ thở (Săn A+)' | 'Vừa sức' | 'Khá khó' | 'Rất khó (Hardcore)'
  husCommunityReview: string; // Tổng hợp review từ Góc nhìn HUS / Sinh viên Toán-Cơ-Tin HUS
  workload: string; // Trọng tâm bài tập / thi cử
  fitWithHuan: string; // Độ hợp với bảng điểm của Phạm Ngọc Huân
}

export const HUS_COURSE_DIFFICULTY_DB: Record<string, CourseDifficultyInfo> = {
  // KHỐI I - KIẾN THỨC CHUNG
  THL1057: {
    stars: 1.5,
    levelLabel: 'Rất nhẹ nhàng (Săn A/A+)',
    husCommunityReview:
      'Review Góc nhìn HUS: Môn đại cương dễ thở nhất kỳ, học Online, thầy cô tạo điều kiện điểm chuyên cần và giữa kỳ rất thoáng.',
    workload: 'Điểm danh đầy đủ + 1 bài kiểm tra giữa kỳ + thi cuối kỳ trắc nghiệm/tự luận mở.',
    fitWithHuan: 'Cực kỳ hợp để khóa sổ 21/21 TC Khối I với điểm A/A+.',
  },
  PHI1006: {
    stars: 3.5,
    levelLabel: 'Lý thuyết trừu tượng',
    husCommunityReview: 'Review HUS: Khối lượng khái niệm nhiều, chấm tự luận khá chặt tay ở kỳ 1.',
    workload: 'Thuyết trình nhóm + Thi tự luận cuối kỳ.',
    fitWithHuan: 'Đã hoàn thành (6.1 - C).',
  },
  PEC1008: {
    stars: 3.0,
    levelLabel: 'Vừa sức',
    husCommunityReview: 'Review HUS: Có bài tập tính giá trị thặng dư, tỷ suất lợi nhuận nên dân Tự nhiên dễ học hơn Triết.',
    workload: 'Thảo luận + Thi cuối kỳ.',
    fitWithHuan: 'Đã hoàn thành (6.5 - C+).',
  },
  PHI1002: {
    stars: 2.0,
    levelLabel: 'Dễ đạt A',
    husCommunityReview: 'Review HUS: Nội dung gần gũi thực tế, ôn đúng trọng tâm là đạt A.',
    workload: 'Tiểu luận/Thuyết trình + Thi cuối kỳ.',
    fitWithHuan: 'Đã hoàn thành xuất sắc (8.7 - A).',
  },
  HIS1001: {
    stars: 2.5,
    levelLabel: 'Vừa sức',
    husCommunityReview: 'Review HUS: Học theo các mốc lịch sử và nghị quyết, chăm ghi chép là được B+/A.',
    workload: 'Kiểm tra giữa kỳ + Thi cuối kỳ.',
    fitWithHuan: 'Đã hoàn thành (8.0 - B+).',
  },
  POL1001: {
    stars: 2.0,
    levelLabel: 'Nhẹ nhàng',
    husCommunityReview: 'Review HUS: Môn chính trị dễ lấy điểm cao nếu trình bày rõ ý.',
    workload: 'Thuyết trình + Tự luận.',
    fitWithHuan: 'Đã hoàn thành (8.3 - B+).',
  },
  HUS1011: {
    stars: 2.0,
    levelLabel: 'Nền tảng cơ bản',
    husCommunityReview: 'Review HUS: Nhập môn tin học và tư duy máy tính cơ bản.',
    workload: 'Thực hành phòng máy + Thi cuối kỳ.',
    fitWithHuan: 'Đã hoàn thành (8.1 - B+).',
  },
  FLF1107: {
    stars: 1.5,
    levelLabel: 'Sở trường',
    husCommunityReview: 'Review HUS: Tiếng Anh chuẩn B1 VNU.',
    workload: '4 kỹ năng Nghe - Nói - Đọc - Viết.',
    fitWithHuan: 'Đã hoàn thành tuyệt đối (10.0 - A+).',
  },

  // KHỐI II - THEO LĨNH VỰC (Tự chọn 5/13 TC - ĐÃ XONG 5/5 TC)
  HUS1021: {
    stars: 2.0,
    levelLabel: 'Dễ lấy điểm cao',
    husCommunityReview: 'Review Góc nhìn HUS: Môn tự chọn Khối II quốc dân, kiến thức địa chất & sinh thái thú vị.',
    workload: 'Báo cáo nhóm + Trắc nghiệm.',
    fitWithHuan: 'Đã hoàn thành (8.4 - B+).',
  },
  HUS1023: {
    stars: 2.0,
    levelLabel: 'Rất hợp dân CIS',
    husCommunityReview: 'Review HUS: Làm quen thống kê mô tả và công cụ phân tích dữ liệu, cực lợi cho sinh viên Toán-Tin.',
    workload: 'Thực hành xử lý bảng dữ liệu + Bài tập lớn.',
    fitWithHuan: 'Đã hoàn thành (8.4 - B+).',
  },
  HUS1022: {
    stars: 2.5,
    levelLabel: 'Tự chọn Khối II (Đã đủ Khối II)',
    husCommunityReview: 'Review HUS: Thực hành lắp mạch cảm biến Arduino/ESP32 cơ bản, vui nhưng tốn thời gian làm phần cứng.',
    workload: 'Demo sản phẩm IoT nhóm.',
    fitWithHuan: 'Không cần học thêm vì bạn đã hoàn thành đủ 5/5 TC Khối II.',
  },
  HUS1024: {
    stars: 3.0,
    levelLabel: 'Tự chọn Khối II (Đã đủ Khối II)',
    husCommunityReview: 'Review HUS: Lập trình điều khiển robot cơ bản, khá hay nhưng tốn thời gian lắp ráp.',
    workload: 'Thực hành nhóm.',
    fitWithHuan: 'Không cần học thêm vì bạn đã hoàn thành đủ 5/5 TC Khối II.',
  },
  HIS1056: {
    stars: 2.0,
    levelLabel: 'Tự chọn Khối II (Đã đủ Khối II)',
    husCommunityReview: 'Review HUS: Kiến thức văn hóa Việt Nam nhẹ nhàng, học thuộc lòng.',
    workload: 'Tiểu luận.',
    fitWithHuan: 'Không cần học thêm vì bạn đã hoàn thành đủ 5/5 TC Khối II.',
  },

  // KHỐI IV - THEO NHÓM NGÀNH (Bắt buộc 28 TC - Còn thiếu 2 môn: MAT2407 & MAT1204)
  MAT2407: {
    stars: 4.0,
    levelLabel: 'Khá nặng Toán (Bắt buộc Khối IV)',
    husCommunityReview:
      'Review Góc nhìn HUS: Đặc sản Khoa Toán - Cơ - Tin học! Nhiều thuật toán biến đổi bảng đơn hình (Simplex), bài toán đối ngẫu, quy hoạch lồi và nhân tử Lagrange. Ai mạnh Giải tích sẽ ăn điểm rất đậm.',
    workload: 'Bài tập tính toán tay + Kiểm tra giữa kỳ + Thi tự luận cuối kỳ.',
    fitWithHuan: 'Độ hợp 98%! Bạn đạt Giải tích 1,2 (8.7 A) và Giải tích 3 (10.0 A+) nên môn này chính là mỏ điểm A của bạn ở Kỳ 6.',
  },
  MAT1204: {
    stars: 2.0,
    levelLabel: 'Dễ thở (Bắt buộc Khối IV)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học cách viết báo cáo khoa học, LaTeX, tìm kiếm paper IEEE/Springer và thuyết trình đề cương nghiên cứu. Không áp lực thi cử nặng nề.',
    workload: 'Viết tiểu luận đề cương nghiên cứu + Thuyết trình nhóm.',
    fitWithHuan: 'Độ hợp 95%! Tận dụng Tiếng Anh chuyên ngành (8.0) để đọc paper AI/Data và chuẩn bị luôn cho Khóa luận tốt nghiệp.',
  },

  // KHỐI V.1 - BẮT BUỘC NGÀNH (49 TC)
  MAT3552E: {
    stars: 4.5,
    levelLabel: 'Khó - Cần cày kỹ (Bắt buộc V.1)',
    husCommunityReview:
      'Review Góc nhìn HUS: Một trong những môn xương xẩu nhất ngành! Đi sâu vào Chia để trị, Quy hoạch động nâng cao, Tham lam, Đồ thị luồng và NP-Hard, lại giảng dạy bằng tiếng Anh (mã E).',
    workload: 'Lập trình chấm tự động / Bài tập chứng minh độ phức tạp thuật toán + Thi cuối kỳ.',
    fitWithHuan: 'Cần ôn kỹ lại CTDL&TT (7.4 B) và Toán rời rạc (7.0 B). Lợi thế của bạn là Tiếng Anh rất tốt.',
  },
  MAT3505: {
    stars: 3.0,
    levelLabel: 'Vừa sức (Bắt buộc V.1 - Đang học K5)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học về biểu diễn số nhị phân, mạch logic, kiến trúc MIPS/RISC-V, Pipeline và tính toán bộ nhớ Cache. Nắm chắc công thức tính Hit/Miss Cache và Pipeline hazard là qua nhẹ nhàng.',
    workload: 'Bài tập chương + Thực hành hợp ngữ + Thi cuối kỳ.',
    fitWithHuan: 'Bạn đang học ở Kỳ 5 (Thứ 6 & Thứ 7). Chăm làm bài tập mẫu trên lớp là nắm chắc B+/A.',
  },
  MAT3373E: {
    stars: 3.5,
    levelLabel: 'Vừa sức - Hay (Bắt buộc V.1)',
    husCommunityReview:
      'Review Góc nhìn HUS: Cung cấp kiến thức tổng quan về bảo mật phần mềm (Buffer Overflow, SQL Injection, XSS), mã hóa đối xứng/bất đối xứng, xác thực và an toàn mạng.',
    workload: 'Bài lab thực hành CTF/Security trên Linux + Thi cuối kỳ bằng tiếng Anh.',
    fitWithHuan: 'Rất hợp vì bạn đã đạt điểm A (8.7) môn Linux và A (8.5) môn Cơ sở dữ liệu!',
  },
  MAT3506: {
    stars: 3.0,
    levelLabel: 'Vừa sức (Bắt buộc V.1 - Đang học K5)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học 5 tầng TCP/IP, bắt gói tin Wireshark, chia địa chỉ IP/Subnet và lập trình Socket. Lý thuyết hơi nhiều nhưng đề thi ra rất chuẩn khuôn mẫu.',
    workload: 'Thực hành Wireshark / Lập trình Socket + Thi cuối kỳ.',
    fitWithHuan: 'Bạn đang học chiều Thứ 5 (P.302T5). Chăm chỉ đi học và làm bài tập chia mạng con là dễ đạt A.',
  },
  MAT1206E: {
    stars: 3.0,
    levelLabel: 'Vừa sức & Thú vị (Bắt buộc V.1 - Đang học K5)',
    husCommunityReview:
      'Review Góc nhìn HUS: Nhập môn AI kinh điển (giáo trình Russell & Norvig): Tìm kiếm BFS/DFS/A*, cắt tỉa Alpha-Beta, Logic vị từ và suy diễn xác suất Bayes.',
    workload: 'Thực hành code thuật toán tìm kiếm bằng Python + Thi cuối kỳ.',
    fitWithHuan: 'Độ hợp 96%! Kết hợp hoàn hảo Xác suất thống kê (8.8 A) và Tiếng Anh B1 (10.0 A+) của bạn.',
  },
  MAT3374: {
    stars: 3.0,
    levelLabel: 'Đồ án thực tế (Bắt buộc V.1 - Chốt chặn TQ)',
    husCommunityReview:
      'Review Góc nhìn HUS: Không nặng lý thuyết hàn lâm mà tập trung làm dự án phần mềm thực tế theo nhóm. Điểm cao hay thấp phụ thuộc vào sản phẩm demo và chọn đồng đội tốt.',
    workload: 'Làm đồ án phần mềm nhóm (Web/App/AI System) + Báo cáo sprint hàng tuần.',
    fitWithHuan: 'BẮT BUỘC học ở Kỳ 6 để mở khóa Công nghệ phần mềm (MAT1207) ở Kỳ 7. Hãy nhận phần Database & AI Backend trong nhóm!',
  },
  MAT1207: {
    stars: 2.5,
    levelLabel: 'Nhẹ nhàng (Bắt buộc V.1)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học quy trình phát triển phần mềm (Waterfall, Agile/Scrum), phân tích yêu cầu, vẽ biểu đồ UML (Use Case, Class, Sequence) và kiểm thử (Testing).',
    workload: 'Viết tài liệu đặc tả phần mềm (SRS) + Đồ án nhóm.',
    fitWithHuan: 'Học ở Kỳ 7 sau khi đã xong Thực tập PTPM (MAT3374). Dễ lấy điểm B+/A.',
  },
  MAT3541E: {
    stars: 4.0,
    levelLabel: 'Khá trừu tượng (Bắt buộc V.1)',
    husCommunityReview:
      'Review Góc nhìn HUS: Không phải học code ngôn ngữ mới mà học nguyên lý bên dưới trình biên dịch: cú pháp (BNF, Parse Tree), ngữ nghĩa, kiểu dữ liệu, quản lý vùng nhớ Stack/Heap và lập trình hàm.',
    workload: 'Bài tập phân tích cú pháp / Ngữ nghĩa + Thi cuối kỳ.',
    fitWithHuan: 'Nên xếp vào Kỳ 7 và ôn lại OOP trước khi học.',
  },
  MAT3533: {
    stars: 4.0,
    levelLabel: 'Hơi khó nhưng Cực quan trọng (Bắt buộc V.1 - Đang học K5)',
    husCommunityReview:
      'Review Góc nhìn HUS: Môn học định hình chuyên ngành AI/Data tại HUS! Nặng cả nền tảng Toán (Đạo hàm ma trận, Quy hoạch lồi SVM, PCA) lẫn thực hành code Scikit-Learn/PyTorch.',
    workload: 'Bài tập thực hành huấn luyện mô hình + Project cuối kỳ + Thi lý thuyết.',
    fitWithHuan: 'Bạn đang học ở Kỳ 5. Với nền Giải tích (8.7, 10.0) và XSTK (8.8 A), đây là môn bản lề quan trọng nhất của bạn!',
  },

  // KHỐI V.2.1 - TỰ CHỌN KỸ NĂNG PHẦN MỀM (CHỌN ĐỦ 4/8 TÍN CHỈ - 2 MÔN)
  MAT3519: {
    stars: 3.5,
    levelLabel: 'Khá gắt phần thực hành (Tự chọn V.2.1 - 2 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Tùy lớp dạy Python nâng cao hoặc Java/C#. Yêu cầu code thực hành khá nhiều và chấm test case chặt.',
    workload: 'Bài tập code hàng tuần + Kiểm tra thực hành trên máy.',
    fitWithHuan: 'Đang trong TKB Kỳ 5 của bạn (chú thích: Khó, khả năng bỏ). Nếu bỏ môn này, bạn có thể chọn cặp MAT3558 (Mobile) + MAT3560 (Game) ở kỳ sau để lấy đủ 4/8 TC V.2.1.',
  },
  MAT3558: {
    stars: 2.5,
    levelLabel: 'Dễ lấy A qua Đồ án (Tự chọn V.2.1 - 2 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học phát triển ứng dụng di động (Android/Flutter/React Native). Thầy cô chấm đồ án cuối kỳ rất thoáng nếu giao diện đẹp và chạy mượt.',
    workload: 'Làm 1 ứng dụng Mobile nhỏ theo nhóm hoặc cá nhân.',
    fitWithHuan: 'Rất khuyên chọn (2 TC) để lấy điểm A kéo CPA!',
  },
  MAT3560: {
    stars: 2.5,
    levelLabel: 'Vui & Dễ thở (Tự chọn V.2.1 - 2 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Làm game 2D/3D cơ bản (Unity/Godot/Pygame). Không thi lý thuyết đánh đố, chủ yếu chấm điểm sản phẩm game cuối kỳ.',
    workload: 'Đồ án làm Game 2D/3D.',
    fitWithHuan: 'Lựa chọn thay thế hoàn hảo (2 TC) nếu bạn không muốn học Hệ thống nhúng hay NNLT thứ 2.',
  },
  MAT1208: {
    stars: 4.0,
    levelLabel: 'Khó - Nặng phần cứng (Tự chọn V.2.1 - 2 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Lập trình vi điều khiển C/C++ sát phần cứng, ngắt, timer, giao tiếp UART/I2C/SPI. Khá vất vả nếu không đam mê mạch điện tử.',
    workload: 'Thực hành mạch nhúng + Đồ án phần cứng.',
    fitWithHuan: 'Không khuyến khích vì bạn có điểm trũng ở OOP (5.4) và HĐH (6.6).',
  },

  // KHỐI V.2.2 - TỰ CHỌN AI & PHÁT TRIỂN PHẦN MỀM (CHỌN ĐỦ 12/39 TÍN CHỈ - 4 MÔN)
  MAT3534: {
    stars: 2.5,
    levelLabel: 'Mỏ điểm A cho Huân! (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Giao thoa giữa Cơ sở dữ liệu, Xác suất thống kê và Học máy (Luật kết hợp Apriori/FP-Growth, Phân cụm, Phân lớp, Tiền xử lý dữ liệu). Đề thi và bài tập lớn rất vừa sức.',
    workload: 'Bài tập lớn khai phá bộ dữ liệu thực tế + Thi cuối kỳ.',
    fitWithHuan: 'Độ hợp 99% (Khuyên chọn số 1)! Bạn đạt A cả XSTK (8.8) và CSDL (8.5) nên học môn này cực kỳ nhàn và dễ lấy A+.',
  },
  MAT3452: {
    stars: 3.0,
    levelLabel: 'Sở trường Toán - Thống kê (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Môn thế mạnh truyền thống của Khoa Toán-Cơ-Tin HUS. Học phân phối chuẩn nhiều chiều, hồi quy bội, PCA, phân tích nhân tố (Factor Analysis) trên R/Python.',
    workload: 'Thực hành phân tích dữ liệu trên R/Python + Thi cuối kỳ.',
    fitWithHuan: 'Độ hợp 97% (Khuyên chọn số 2)! Tận dụng trọn vẹn điểm 8.8 XSTK và 8.4 Phân tích dữ liệu của bạn.',
  },
  MAT3561E: {
    stars: 3.5,
    levelLabel: 'Xu hướng Hot AI/LLM (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học từ tiền xử lý văn bản, N-gram, Word2Vec, RNN/LSTM đến Transformer, BERT và ứng dụng LLM/RAG. Rất thực tế để làm Khóa luận tốt nghiệp.',
    workload: 'Project huấn luyện mô hình xử lý văn bản tiếng Việt/Anh + Báo cáo.',
    fitWithHuan: 'Độ hợp 95% (Khuyên chọn số 3)! Mở khóa ngay ở Kỳ 6 sau khi bạn học xong Học máy (MAT3533) ở Kỳ 5.',
  },
  MAT2034: {
    stars: 2.5,
    levelLabel: 'Cực dễ lấy A+ cho dân giỏi Giải tích (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học các thuật toán giải gần đúng phương trình phi tuyến (Chia đôi, Newton), nội suy đa thức Lagrange/Spline, tích phân số Simpson và giải số PTVP (Euler, Runge-Kutta). Công thức rõ ràng, cứ bấm máy/code đúng thuật toán là 9-10 điểm!',
    workload: 'Bài tập tính toán theo công thức + Lập trình Matlab/Python cơ bản.',
    fitWithHuan: 'Độ hợp 98% (Khuyên chọn số 4)! Bạn đạt 10.0 (A+) Giải tích 3 và 8.5 (A) PTVP nên môn này cầm chắc điểm A/A+!',
  },
  MAT3542: {
    stars: 2.5,
    levelLabel: 'Thực tế - Chấm đồ án thoáng (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học xây dựng ứng dụng Web hoàn chỉnh (HTML/CSS/JS, React/Node.js hoặc Python Backend + Database). Không nặng toán, chấm điểm qua sản phẩm đồ án nhóm.',
    workload: 'Làm đồ án Website theo nhóm.',
    fitWithHuan: 'Độ hợp 90%! Rất tốt nếu bạn muốn có thêm kỹ năng làm Web để demo các mô hình AI.',
  },
  MAT3453: {
    stars: 2.5,
    levelLabel: 'Nhẹ nhàng, thuần Thống kê (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học các kỹ thuật lấy mẫu ngẫu nhiên đơn, lấy mẫu phân tầng, lấy mẫu cụm và ước lượng sai số thống kê. Ít phải code phức tạp, công thức ngắn gọn.',
    workload: 'Bài tập tính cỡ mẫu & ước lượng + Thi cuối kỳ.',
    fitWithHuan: 'Độ hợp 94%! Rất hợp với điểm A (8.8) môn Xác suất thống kê của bạn.',
  },
  MAT3535: {
    stars: 3.0,
    levelLabel: 'Vừa sức - Gần với NLP & Web (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học cách hoạt động của máy tìm kiếm (Search Engine): Chỉ mục ngược (Inverted Index), TF-IDF, BM25, Vector Space Model và thuật toán PageRank.',
    workload: 'Xây dựng hệ thống tìm kiếm văn bản nhỏ + Thi cuối kỳ.',
    fitWithHuan: 'Độ hợp 92%! Kết hợp tốt giữa CTDL&TT và Xác suất thống kê.',
  },
  MAT3562E: {
    stars: 4.0,
    levelLabel: 'Khá nặng tích chập & Deep Learning (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Xử lý ảnh số, bộ lọc không gian/tần số, phát hiện cạnh Canny, đặc trưng SIFT và mạng CNN (YOLO, ResNet, U-Net). Cần GPU/Colab để train mô hình.',
    workload: 'Bài tập xử lý ảnh OpenCV + Đồ án nhận diện ảnh bằng Deep Learning.',
    fitWithHuan: 'Độ hợp 88%. Hay nhưng khối lượng train mô hình khá nặng.',
  },
  MAT3538: {
    stars: 3.0,
    levelLabel: 'Lý thuyết biểu diễn tri thức (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Mở rộng phần Logic của môn Nhập môn AI: Hệ chuyên gia, Ontology, Đồ thị tri thức (Knowledge Graph) và suy diễn mờ.',
    workload: 'Tiểu luận / Bài tập lớn xây dựng hệ tri thức + Thi cuối kỳ.',
    fitWithHuan: 'Độ hợp 88%. Phù hợp nếu bạn thích hướng Knowledge Graph kết hợp LLM.',
  },
  MAT3539: {
    stars: 4.0,
    levelLabel: 'Nặng Toán Đại số & Số học (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Đi sâu vào toán mật mã: Hệ mật cổ điển, DES, AES trên trường hữu hạn GF(2^8), RSA, ElGamal, đường cong Elliptic (ECC) và chữ ký số.',
    workload: 'Bài tập tính toán đồng dư/trường hữu hạn + Thi tự luận.',
    fitWithHuan: 'Độ hợp 82%. Cần ôn kỹ Toán rời rạc và Đại số tuyến tính.',
  },
  MAT3148: {
    stars: 4.5,
    levelLabel: 'Rất khó - Lập trình hệ thống C/C++ (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Lập trình đa luồng Pthreads, OpenMP, truyền thông điệp MPI và lập trình GPU CUDA bằng C/C++. Dễ gặp lỗi đồng bộ và con trỏ.',
    workload: 'Thực hành code C/C++ song song hiệu năng cao.',
    fitWithHuan: 'Không khuyến khích vì bạn có điểm trũng ở Lập trình hướng đối tượng (5.4) và HĐH (6.6).',
  },
  MAT3554E: {
    stars: 4.5,
    levelLabel: 'Rất khó - Lý thuyết thuần túy (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Môn lý thuyết khoa học máy tính thuần túy: Ôtômat hữu hạn (DFA/NFA), Biểu thức chính quy, Văn phạm phi ngữ cảnh (CFG), Pushdown Automata và Máy Turing.',
    workload: 'Chứng minh toán học chặt chẽ bằng tiếng Anh.',
    fitWithHuan: 'Khá khô khan và khó kéo điểm A+, nên ưu tiên các môn Data/AI thực tiễn hơn.',
  },
  MAT3563: {
    stars: 4.5,
    levelLabel: 'Chuyên đề nâng cao CV (Tự chọn V.2.2 - 3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Yêu cầu phải học xong Thị giác máy tính (MAT3562E) trước. Đi sâu vào các bài báo nghiên cứu 3D Vision, Video Understanding và Generative Models.',
    workload: 'Đọc báo cáo paper quốc tế + Cài đặt thực nghiệm.',
    fitWithHuan: 'Chỉ nên chọn nếu bạn làm Khóa luận chuyên sâu về Computer Vision.',
  },

  // KHỐI V.3 - TỐT NGHIỆP (7 TÍN CHỈ)
  MAT4080: {
    stars: 3.5,
    levelLabel: 'Cơ hội vàng lấy 7 TC điểm A+ (Khóa luận V.3)',
    husCommunityReview:
      'Review Góc nhìn HUS: Sinh viên đủ điều kiện làm Khóa luận tốt nghiệp (7 TC) tại HUS thường được thầy cô hướng dẫn sát sao và hội đồng chấm rất quý, đa số đạt điểm A (3.7) hoặc A+ (4.0) — kéo CPA toàn khóa cực mạnh!',
    workload: 'Nghiên cứu và bảo vệ khóa luận trước hội đồng.',
    fitWithHuan: 'CPA hiện tại của bạn là 3.26 (Giỏi) nên dư sức đủ điều kiện nhận Khóa luận tốt nghiệp!',
  },
  MAT1203: {
    stars: 3.0,
    levelLabel: 'Học phần thay thế KLTN (4 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Dành cho các bạn không làm Khóa luận. Học phân tích thiết kế hệ thống thông tin doanh nghiệp, sơ đồ luồng dữ liệu DFD, ERD và kiến trúc hệ thống.',
    workload: 'Đồ án phân tích thiết kế hệ thống + Thi cuối kỳ.',
    fitWithHuan: 'Chỉ học nếu bạn chọn phương án Học phần thay thế thay vì làm Khóa luận.',
  },
  MAT3377: {
    stars: 3.5,
    levelLabel: 'Học phần thay thế KLTN (3 TC)',
    husCommunityReview:
      'Review Góc nhìn HUS: Học cùng với MAT1203 (4 TC) để đủ 7 TC thay thế khóa luận. Tìm hiểu các chủ đề hiện đại của AI.',
    workload: 'Tiểu luận & thuyết trình chuyên đề AI.',
    fitWithHuan: 'Chỉ học nếu bạn chọn phương án Học phần thay thế thay vì làm Khóa luận.',
  },
};

export function getCourseDifficulty(code: string): CourseDifficultyInfo {
  return (
    HUS_COURSE_DIFFICULTY_DB[code] || {
      stars: 3.0,
      levelLabel: 'Vừa sức',
      husCommunityReview: 'Theo mặt bằng chung tại Khoa Toán - Cơ - Tin học (HUS), chăm chỉ đi học và làm bài tập đầy đủ sẽ đạt B+/A.',
      workload: 'Bài tập thường xuyên + Kiểm tra giữa kỳ + Thi cuối kỳ.',
      fitWithHuan: 'Phù hợp với lộ trình chuẩn QĐ 3568.',
    }
  );
}

export function getCourseCategoryMeta(course: { sub_block: string; type: string }) {
  if (course.sub_block === 'V.2.1') {
    return {
      shortBadge: 'Tự chọn V.2.1 (4/8 TC)',
      badgeText: 'Tự chọn V.2.1 - Kỹ năng PM (Chọn 4/8 TC)',
      badgeBg:
        'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    };
  }
  if (course.sub_block === 'V.2.2') {
    return {
      shortBadge: 'Tự chọn V.2.2 (12/39 TC)',
      badgeText: 'Tự chọn V.2.2 - Chuyên sâu AI & PTPM (Chọn 12/39 TC)',
      badgeBg:
        'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    };
  }
  if (course.sub_block === 'V.3') {
    return {
      shortBadge: 'Tốt nghiệp V.3 (7 TC)',
      badgeText: 'Khối V.3 - Tốt nghiệp (Chọn 7 TC)',
      badgeBg:
        'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    };
  }
  if (course.sub_block === 'II') {
    return {
      shortBadge: 'Tự chọn Khối II (5/5 TC)',
      badgeText: 'Tự chọn Khối II - Lĩnh vực (Đã đủ 5/5 TC)',
      badgeBg:
        'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    };
  }
  return {
    shortBadge: `Bắt buộc (${course.sub_block})`,
    badgeText: `Bắt buộc Khối ${course.sub_block}`,
    badgeBg:
      'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
  };
}
