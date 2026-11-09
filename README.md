# HUS CIS Academic Navigator & AI Advisor (GPA-Huan)

> **Hệ thống Quản lý Tiến độ Học tập, Trực quan hóa Cây Môn học Kép, Không gian Học kỳ 5 & NCKH NLP, Mô phỏng CPA và Cố vấn Học tập AI tích hợp RAG Neural Embeddings** dành cho sinh viên ngành **Khoa học máy tính và thông tin (7480113QTD)** - Trường Đại học Khoa học Tự nhiên, Đại học Quốc gia Hà Nội (VNU-HUS) theo **Quyết định 3568/QĐ-ĐHKHTN**.

**Nhà sáng tạo:** Phạm Ngọc Huân (HUS Computer & Information Science)

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. 🌳 Cây Môn Học Tương Tác & Trực Quan (Interactive Skill Tree Graph)
- Trực quan hóa toàn bộ 61 học phần của khung chương trình 129 tín chỉ tính GPA.
- Hỗ trợ **2 chế độ xem**:
  - *Môn tiên quyết (Prerequisites)*: Vẽ rõ các ràng buộc bắt buộc theo QĐ 3568.
  - *Liên kết nền tảng tri thức (Knowledge Graph)*: Thể hiện mối liên hệ kiến thức bổ trợ giữa các môn học.
- **Tính năng Khóa vị trí (Lock Layout)**: Ngăn chặn thao tác kéo thả nhầm khi xem hoặc zoom cây môn học.
- Bộ lọc thông minh theo khối kiến thức (Khối I, II, III, IV, V), trạng thái hoàn thành và thanh tìm kiếm nhanh.

### 2. 📅 Không Gian Học Kỳ 5 & NCKH NLP (Current Semester Hub)
- **Thời khóa biểu Học kỳ 5**: Hiển thị trực quan 6 môn học (16 tín chỉ), phòng học thực tế (302T5, 101T5, 506T4, 513T4, 102T5), tiết học và ghi chú môn học.
- **Không gian Nghiên cứu Khoa học (NCKH) NLP**: Quản lý đề tài *SemEval-2027: Semantic change across multiple time periods*, giảng viên hướng dẫn, checklist các mốc tiến độ, link tài liệu/paper và ghi chú thực nghiệm với các mô hình *PhoBERT, ViT5, PyTorch, VectorDB*.
- **Sổ tay môn học Kỳ 5**: Ghi chép cá nhân cho từng môn học và tự động đồng bộ vào hệ thống RAG của Cố vấn AI.

### 3. 📊 Mô Phỏng & Lập Kế Hoạch CPA (CPA Simulator & Planner)
- Tính toán chính xác CPA Hệ 4 và Hệ 10 theo đúng chuẩn quy chế tín chỉ của ĐHQGHN.
- **Quy chế Học cải thiện chuẩn xác**: Chỉ cho phép chọn học cải thiện các môn đạt điểm **D hoặc D+** (môn `MAT1202 - Lập trình hướng đối tượng`).
- Mô phỏng điểm số các kỳ tiếp theo và tính toán mục tiêu CPA tốt nghiệp (Giỏi / Xuất sắc).
- Phân loại rõ các môn Bắt buộc và Tự chọn theo từng phân khối (V.2.1 Kỹ năng phần mềm, V.2.2 Chuyên sâu AI & PTPM) kèm xếp hạng độ khó từ **0 đến 5 sao** (tham khảo cộng đồng sinh viên HUS và Góc nhìn HUS).

### 4. 🧭 La Bàn Định Hướng Nghề Nghiệp (Career Compass)
- 6 lộ trình nghề nghiệp chuyên sâu: *AI & Machine Learning Engineer, Data Scientist, Fullstack Developer, DevOps & Cloud Architect, Computer Vision Specialist, Cybersecurity Engineer*.
- Tự động đo lường % độ phù hợp dựa trên các môn đã tích lũy và đề xuất các môn tự chọn tối ưu để đón đầu thị trường tuyển dụng.

### 5. 🤖 Cố Vấn Học Tập AI Tích Hợp RAG Neural Search (AI Academic Advisor)
- **Hệ thống RAG Chuyên sâu (Gemini Embeddings 3072 chiều)**: Chunking & Indexing 67 tài liệu tri thức (đề cương 61 môn học, bảng điểm 71 TC, thời khóa biểu Kỳ 5, NCKH NLP, kinh nghiệm chọn giảng viên và quy chế tốt nghiệp).
- **Hybrid Retrieval (Dense + BM25)**: Nhận diện chính xác tên viết tắt của sinh viên HUS (`DAA`, `OOP`, `ML`, `AI`, `NLP`, `KTMT`, `MMT`, `XSTK`...).
- **Citations minh bạch**: Hiển thị danh sách nguồn dữ liệu RAG đã trích xuất đối sánh cho từng câu trả lời.
- **Phản hồi tự nhiên, chuẩn mực**: Trả lời trực tiếp, không sử dụng ký tự `**` gây rối mắt, phân biệt thông minh giữa câu hỏi và lệnh nạp kiến thức mới.
- Hỗ trợ linh hoạt các mô hình tiên tiến: `gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-4-argon` và các mô hình AgentRouter.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, @xyflow/react.
- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic, NumPy, OpenPyXL.
- **AI & RAG Engine:** Google GenAI SDK (`google-genai`), `gemini-embedding-001` (3072 dimensions), Cosine Similarity, BM25 Lexical Matching.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)

### 1. Yêu Cầu Môi Trường
- Node.js >= 18
- Python >= 3.10
- Git

### 2. Cài Đặt

```bash
# Clone repository
git clone https://github.com/Winter101006/GPA-Huan.git
cd GPA-Huan

# Cài đặt Frontend dependencies
npm install

# Cài đặt Backend dependencies
pip install -r requirements.txt
```

### 3. Cấu Hình Biến Môi Trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Điền `GEMINI_API_KEY` của bạn vào file `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-3.5-flash-lite
```

### 4. Khởi Chạy Ứng Dụng

**Chạy Backend (FastAPI - Cổng 8000):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Chạy Frontend (Vite - Cổng 5173):**
```bash
npm run dev
```

Truy cập giao diện Web tại: **`http://localhost:5173`**

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```
GPA-Huan/
├── backend/
│   ├── main.py              # FastAPI endpoints & AI Advisor orchestration
│   └── rag_engine.py        # Gemini Embeddings (3072-dim) & Hybrid RAG Retrieval
├── data/
│   ├── academic_database.json # 61 môn học chuẩn QĐ 3568 & quan hệ tiên quyết
│   ├── user_progress.json     # Tiến độ học tập, điểm số & NCKH NLP của Huân
│   ├── rag_chunks.json        # 67 chunks tri thức nạp vào RAG
│   └── rag_embeddings.npz     # Vector embeddings đã nén
├── scripts/
│   └── build_database.py    # Script đồng bộ dữ liệu từ Excel QĐ 3568
├── src/
│   ├── components/
│   │   ├── AIAdvisorPanel.tsx       # Giao diện Cố vấn AI & trích dẫn RAG
│   │   ├── CareerCompass.tsx        # La bàn định hướng nghề nghiệp
│   │   ├── CPASimulatorPlanner.tsx  # Mô phỏng CPA & quy chế cải thiện môn D/D+
│   │   ├── CurrentSemesterHub.tsx   # Hub Kỳ 5, TKB & Workspace NCKH NLP
│   │   ├── DegreeAuditDashboard.tsx # Bảng theo dõi tiến độ tích lũy
│   │   └── SkillTreeGraph.tsx       # Đồ thị cây môn học tương tác
│   ├── types/
│   │   └── academic.ts      # TypeScript interfaces & types
│   ├── utils/
│   │   └── academicMath.ts  # Thuật toán tính CPA hệ 4 & 10 chuẩn ĐHQGHN
│   ├── App.tsx              # Component ứng dụng chính
│   └── main.tsx             # Entry point React
├── 104.-KHMTTT-chuẩn final QD 3568 Scan final.pdf # Bản scan QĐ 3568
├── Gpa của huân.xlsx         # Bảng điểm gốc của Phạm Ngọc Huân
├── package.json             # Cấu hình thư viện Frontend
├── requirements.txt         # Cấu hình thư viện Backend Python
└── README.md                # Tài liệu hướng dẫn dự án
```

---

## 👤 Tác Giả & Bản Quyền

- **Họ và tên:** Phạm Ngọc Huân
- **GitHub:** [@Winter101006](https://github.com/Winter101006)
- **Đơn vị:** Khoa Toán - Cơ - Tin học, Trường Đại học Khoa học Tự nhiên, Đại học Quốc gia Hà Nội (VNU-HUS)
- **Quyết định ban hành CTĐT:** 3568/QĐ-ĐHKHTN
