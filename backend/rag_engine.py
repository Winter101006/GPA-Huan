import os
import re
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from dotenv import load_dotenv

load_dotenv()

RAG_CHUNKS_PATH = "data/rag_chunks.json"
RAG_EMBEDDINGS_PATH = "data/rag_embeddings.npz"

class RAGChunk:
    def __init__(self, chunk_id: str, title: str, category: str, content: str, course_code: Optional[str] = None):
        self.chunk_id = chunk_id
        self.title = title
        self.category = category  # 'course', 'transcript', 'semester5', 'nlp_research', 'reviews', 'regulations', 'memory'
        self.content = content
        self.course_code = course_code

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "title": self.title,
            "category": self.category,
            "content": self.content,
            "course_code": self.course_code
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "RAGChunk":
        return cls(
            chunk_id=d["chunk_id"],
            title=d["title"],
            category=d["category"],
            content=d["content"],
            course_code=d.get("course_code")
        )

def build_curriculum_rag_chunks(db: Dict[str, Any], progress: Dict[str, Any]) -> List[RAGChunk]:
    chunks: List[RAGChunk] = []

    # 1. Regulations and Degree Rules Chunk
    chunks.append(RAGChunk(
        chunk_id="reg-vnu-hus-degree",
        title="Quy chế đào tạo ĐHQGHN & Khung CTĐT 3568/QĐ-ĐHKHTN",
        category="regulations",
        content=(
            "Quy định chuẩn tốt nghiệp ngành Khoa học máy tính và thông tin (7480113QTD) theo QĐ 3568/QĐ-ĐHKHTN:\n"
            "• Tổng tín chỉ tính GPA tích lũy: 129 tín chỉ.\n"
            "• Khối I: Kiến thức chung (21 TC tính GPA) + Học phần điều kiện (GDQP 8 TC, GDTC 4 TC, Kỹ năng bổ trợ 3 TC không tính GPA).\n"
            "• Khối II: Kiến thức theo lĩnh vực (chọn 5/13 TC - Huân đã hoàn thành 5/5 TC).\n"
            "• Khối III: Kiến thức theo khối ngành (3 TC - MAT2505 Lập trình cơ bản - Huân đã học xong).\n"
            "• Khối IV: Kiến thức theo nhóm ngành (28 TC - Đã học 22 TC, còn thiếu 6 TC: MAT2407 Tối ưu hóa 3 TC và MAT1204 Phương pháp NCKH 3 TC).\n"
            "• Khối V: Kiến thức ngành (72 TC gồm V.1 Bắt buộc 49 TC, V.2.1 Tự chọn Kỹ năng PM chọn đúng 4/8 TC, V.2.2 Tự chọn Chuyên sâu AI & PTPM chọn đúng 12/39 TC, V.3 Khóa luận tốt nghiệp hoặc học phần thay thế 7 TC).\n"
            "• QUY CHẾ HỌC CẢI THIỆN ĐHQGHN: Sinh viên CHỈ được phép đăng ký học cải thiện điểm đối với các môn đạt điểm D hoặc D+ (điểm hệ 4 từ 1.0 đến 1.5). Các môn đạt từ điểm C trở lên (C, C+, B, B+, A) KHÔNG được phép học cải thiện. Để không bị hạ hạng bằng Giỏi/Xuất sắc xuống Khá khi tốt nghiệp, số tín chỉ học cải thiện không vượt quá 5% tổng số tín chỉ toàn khóa (tối đa 6.45 tín chỉ). Hiện tại Phạm Ngọc Huân chỉ có 1 môn D+ là MAT1202 OOP (3 TC, chiếm 2.33%), nên nếu cải thiện môn này lên A/A+ thì hoàn toàn giữ trọn 100% bằng Giỏi/Xuất sắc."
        )
    ))

    # 2. Student Transcript & Progress Overview
    courses_state = progress.get("courses_state", {})
    completed_courses = [c for c in db["courses"] if courses_state.get(c["code"], {}).get("completed", c.get("completed", False)) and c.get("counts_gpa", True)]
    total_tc = sum(c["credits"] for c in completed_courses)
    cpa4 = round(sum(c["credits"] * (courses_state.get(c["code"], {}).get("score4") or c.get("score4") or 0) for c in completed_courses) / max(total_tc, 1), 2)
    cpa10 = round(sum(c["credits"] * (courses_state.get(c["code"], {}).get("score10") or c.get("score10") or 0) for c in completed_courses) / max(total_tc, 1), 2)

    chunks.append(RAGChunk(
        chunk_id="profile-huan-transcript",
        title="Hồ sơ học tập & Bảng điểm thực tế Phạm Ngọc Huân",
        category="transcript",
        content=(
            f"Sinh viên: Phạm Ngọc Huân. Ngành: Khoa học máy tính và thông tin (7480113QTD) - Trường Đại học Khoa học Tự nhiên, ĐHQGHN (HUS).\n"
            f"• Đã hoàn thành (Kỳ 1 đến Kỳ 4): 23 môn học, tích lũy {total_tc}/129 tín chỉ GPA (55.04%). Còn thiếu 58 tín chỉ.\n"
            f"• CPA Hệ 4: {cpa4:.2f}/4.00 (Chính xác: 3.2620, Xếp loại Giỏi). CPA Hệ 10: {cpa10:.2f}/10.00 (Chính xác: 7.9465).\n"
            f"• Chi tiết toàn bộ 23 môn đã học và điểm số:\n"
            f"  - 2 môn điểm A+ (4.0): MAT2503 Giải tích 3 (10.0), FLF1107 Tiếng Anh B1 (5 TC, 10.0).\n"
            f"  - 7 môn điểm A (3.7): MAT2501 Giải tích 1 (8.7), MAT2502 Giải tích 2 (8.7), MAT2323 Xác suất - Thống kê (8.8), MAT2403 Phương trình vi phân (8.5), MAT3507 Cơ sở dữ liệu (8.5), MAT3557 Môi trường lập trình Linux (8.7), PHI1002 Chủ nghĩa xã hội khoa học (8.7).\n"
            f"  - 6 môn điểm B+ (3.5): HUS1011 Tin học cơ sở (8.1), HIS1001 Lịch sử Đảng (8.0), HUS1023 Nhập môn phân tích dữ liệu (8.4), HUS1021 Khoa học Trái Đất và sự sống (8.4), MAT1205E Tiếng Anh chuyên ngành KHMT (8.0), POL1001 Tư tưởng Hồ Chí Minh (8.3).\n"
            f"  - 3 môn điểm B (3.0): MAT2400 Đại số tuyến tính (7.1), MAT3500 Toán rời rạc (7.0), MAT3514 Cấu trúc dữ liệu và giải thuật (7.4).\n"
            f"  - 3 môn điểm C+ (2.5): MAT2505 Lập trình cơ bản (6.6), PEC1008 Kinh tế chính trị Mác - Lênin (6.5), MAT3550E Nguyên lí hệ điều hành (6.6).\n"
            f"  - 1 môn điểm C (2.0): PHI1006 Triết học Mác - Lênin (6.1).\n"
            f"  - 1 môn điểm D+ (1.5): MAT1202 Lập trình hướng đối tượng (OOP, 5.4 - Môn duy nhất được phép học cải thiện).\n"
            f"• Thế mạnh học thuật nổi trội: Toán giải tích & mô hình hóa (9.1/10), Ngoại ngữ tiếng Anh chuyên môn (9.0/10), Xác suất thống kê & Cơ sở dữ liệu (8.6/10)."
        )
    ))

    # 3. Semester 5 Real-world Timetable & Workspace
    chunks.append(RAGChunk(
        chunk_id="semester5-in-progress",
        title="Học kỳ 5 hiện tại: Thời khóa biểu & 6 môn đang học (16 TC)",
        category="semester5",
        content=(
            "Thông tin Học kỳ 5 hiện tại của Phạm Ngọc Huân (Đang học 6 môn, tổng 16 tín chỉ):\n"
            "1. MAT1206E - Trí tuệ nhân tạo (3 TC): Lớp MAT1206E 3. Thực hành sáng Thứ 2 (Tiết 3-4), Lý thuyết chiều Thứ 6 (Tiết 7-8, phòng 506T4). Ghi chú: Chăm là được, môn cốt lõi mở khóa NLP và Computer Vision.\n"
            "2. MAT3533 - Học máy (Machine Learning - 3 TC): Lớp MAT3533 2. Lý thuyết chiều Thứ 2 (Tiết 9-10, phòng 101T5), Thực hành chiều Thứ 4 (Tiết 7-8). Ghi chú: Hơi khó, cố gắng học, nên học thầy Hà Quang Thụy vì thầy giảng rất sâu sắc.\n"
            "3. MAT3506 - Mạng máy tính (3 TC): Lớp MAT3506 1. Chiều Thứ 5 (Tiết 7-10, phòng 302T5). Ghi chú: Chăm là được, thi lý thuyết mạng + chia Subnet IPv4 và thực hành Wireshark.\n"
            "4. MAT3505 - Kiến trúc máy tính (3 TC): Lớp MAT3505 2. Lý thuyết chiều Thứ 6 (Tiết 9-10, phòng 513T4), Thực hành sáng Thứ 7 (Tiết 3-4, phòng 102T5). Ghi chú: Chăm là được, ôn kỹ tính địa chỉ bộ nhớ Cache và tập lệnh MIPS.\n"
            "5. THL1057 - Nhà nước và pháp luật đại cương (2 TC): Lớp THL1057 8. Học Online sáng Thứ 5 (Tiết 4-5). Ghi chú: Nhẹ nhàng, chăm chỉ điểm danh và làm bài tập là lấy A/A+ để hoàn thành 100% Khối I.\n"
            "6. MAT3519 - Ngôn ngữ lập trình thứ 2 (2 TC): Lớp MAT3519 3. Chiều Thứ 2 (Tiết 7-8, phòng 202T5) và Chiều Thứ 4 (Tiết 10-12). Ghi chú của Huân: 'Khó, khả năng bỏ'. Phân tích: Thuộc tự chọn V.2.1 (yêu cầu 4/8 TC), nếu Huân rút môn này thì Kỳ 6 đăng ký Lập trình di động (MAT3558 - 2 TC) và Phát triển game (MAT3560 - 2 TC) vừa nhẹ vừa dễ đạt điểm A."
        )
    ))

    # 4. Scientific Research (NCKH) in NLP Workspace
    nlp_data = progress.get("nlp_research", {})
    chunks.append(RAGChunk(
        chunk_id="nlp-research-workspace",
        title="Nghiên cứu khoa học (NCKH) về NLP của Huân tại Kỳ 5",
        category="nlp_research",
        content=(
            f"Dự án Nghiên cứu khoa học (NCKH) của Phạm Ngọc Huân đang thực hiện trong Học kỳ 5:\n"
            f"• Đề tài: {nlp_data.get('topic_title', 'Nghiên cứu Xử lý Ngôn ngữ Tự nhiên (NLP) Tiếng Việt, LLM & RAG')}.\n"
            f"• Giảng viên hướng dẫn: {nlp_data.get('advisor_name', 'Giảng viên hướng dẫn Khoa Toán - Cơ - Tin học HUS')}.\n"
            f"• Mục tiêu chiến lược: {nlp_data.get('research_goal', 'Xây dựng mô hình NLP thực nghiệm, công bố bài báo Hội nghị SV NCKH cấp Khoa/Trường và phát triển thành đề tài Khóa luận tốt nghiệp MAT4080 đạt A+ (7 TC)')}.\n"
            f"• Công nghệ, mô hình & Dataset: {nlp_data.get('datasets_and_models', 'PhoBERT, ViT5, Llama-3-Vi, HuggingFace, PyTorch, LangChain, VectorDB')}.\n"
            f"• Lợi ích kép (Double Benefit) với lộ trình học tập:\n"
            f"  - Tại Kỳ 5: Kết quả thực nghiệm NLP dùng làm đồ án cuối kỳ cho cả môn Học máy (MAT3533) và Trí tuệ nhân tạo (MAT1206E).\n"
            f"  - Tại Kỳ 6: Đăng ký ngay MAT1204 (Phương pháp NCKH - 2 sao) để dùng chính bài báo NLP làm tiểu luận lấy điểm A+, đồng thời học MAT3561E (Xử lí ngôn ngữ tự nhiên) và MAT3535 (Tìm kiếm thông tin - nền tảng RAG) để lấy trọn điểm A+.\n"
            f"  - Tại Kỳ 8: Phát triển thành Khóa luận tốt nghiệp MAT4080 (7 TC), hội đồng chấm rất đánh giá cao và nắm chắc điểm A+."
        )
    ))

    # 5. Course Knowledge Chunks for curriculum courses
    course_reviews = {
        "MAT2407": "Môn Tối ưu hóa (3 TC | Khối IV Bắt buộc | 4/5 sao ★★★★☆): Ghi chú giảng viên quan trọng: NÊN HỌC THẦY PHAN, KHÔNG NÊN HỌC THẦY DŨNG. Nội dung học Quy hoạch tuyến tính (Simplex, đối ngẫu), Tối ưu không ràng buộc (Gradient Descent, Newton), quy hoạch lồi. Rất hợp với nền Giải tích 1, 2, 3 (8.7, 8.7, 10.0) của Huân.",
        "MAT3552E": "Môn Thiết kế và đánh giá thuật toán (DAA - Algorithm Design and Analysis, 3 TC | Khối V.1 Bắt buộc | 4/5 sao ★★★★☆): Khá thử thách tư duy thuật toán, học bằng tiếng Anh. Nội dung gồm: Phân tích độ phức tạp thời gian Big-O, phương pháp Master Theorem, Chia để trị (Divide and Conquer), Quy hoạch động nâng cao (Dynamic Programming), Thuật toán tham lam (Greedy), bài toán luồng cực đại và lớp bài toán NP-Đầy đủ (NP-Completeness). Lời khuyên ôn tập cho Huân: Ôn lại Cấu trúc dữ liệu và giải thuật (MAT3514 - Huân được 7.4 B) và Toán rời rạc (MAT3500 - 7.0 B), luyện trước các dạng bài Quy hoạch động và Tham lam.",
        "MAT1204": "Môn Phương pháp nghiên cứu khoa học (3 TC | Khối IV Bắt buộc | 2/5 sao ★★☆☆☆): Rất nhẹ nhàng, không thi giải thuật nặng. Học cách tìm kiếm tổng quan tài liệu (Literature Review), viết báo cáo chuẩn IMRAD, trích dẫn LaTeX/BibTeX. Huân đang làm NCKH về NLP ở Kỳ 5 nên Kỳ 6 học môn này dùng luôn đề tài NLP làm báo cáo là chắc chắn đạt A+.",
        "MAT3374": "Môn Thực tập thực tế phát triển phần mềm (3 TC | Khối V.1 Bắt buộc | 3/5 sao ★★★☆☆): Thực hành làm việc nhóm theo mô hình Agile/Scrum, thiết kế CSDL và code sản phẩm phần mềm hoàn chỉnh. Bắt buộc phải học ở Kỳ 6 để mở khóa MAT1207 (Công nghệ phần mềm) ở Kỳ 7.",
        "MAT1207": "Môn Công nghệ phần mềm (3 TC | Khối V.1 Bắt buộc | 3/5 sao ★★★☆☆): Yêu cầu tiên quyết phải học xong MAT3374. Học về vòng đời phát triển phần mềm (SDLC), phân tích đặc tả yêu cầu SRS, vẽ biểu đồ UML (Use Case, Class, Sequence) và kiểm thử chất lượng.",
        "MAT3561E": "Môn Xử lí ngôn ngữ tự nhiên (NLP, 3 TC | Tự chọn V.2.2 | 3.5/5 sao ★★★☆☆): Môn TỦ số 1 của Huân! Học về tiền xử lý văn bản, Word Embeddings (Word2Vec), RNN/LSTM, Attention và kiến trúc Transformer (BERT, GPT), LLM. Vì Huân đang làm NCKH về NLP ở Kỳ 5 nên học môn này ở Kỳ 6 là lợi thế tuyệt đối.",
        "MAT3534": "Môn Khai phá dữ liệu (Data Mining, 3 TC | Tự chọn V.2.2 | 3/5 sao ★★★☆☆): Học luật kết hợp Apriori, phân cụm KMeans/DBSCAN, phân lớp và phát hiện ngoại lai. Rất hợp với điểm A Xác suất thống kê (8.8) và CSDL (8.5) của Huân.",
        "MAT3535": "Môn Tìm kiếm thông tin (Information Retrieval, 3 TC | Tự chọn V.2.2 | 2/5 sao ★★☆☆☆): Khá nhẹ nhàng, học về mô hình không gian vector, TF-IDF, BM25, Semantic Search. Đây chính là nền tảng cốt lõi của RAG (Retrieval-Augmented Generation) trong NLP!",
        "MAT3558": "Môn Lập trình cho thiết bị di động (Mobile, 2 TC | Tự chọn V.2.1 | 2/5 sao ★★☆☆☆): Dễ lấy điểm A, thực hành code ứng dụng Flutter/React Native/Android, chấm đồ án thoáng. Khuyên chọn để tích đủ 4/8 TC khối V.2.1.",
        "MAT3560": "Môn Phát triển phần mềm trò chơi (Game, 2 TC | Tự chọn V.2.1 | 2/5 sao ★★☆☆☆): Làm game 2D/3D trên Unity/Godot, đồ án nhóm vui và dễ đạt điểm A. Nên kết hợp cùng MAT3558.",
        "MAT1208": "Môn Mạng không dây (2 TC | Tự chọn V.2.1 | 3/5 sao ★★★☆☆): Học tiếp sau môn Mạng máy tính (MAT3506 Kỳ 5), tìm hiểu sóng radio, WiFi, mạng di động 4G/5G.",
        "MAT3373E": "Môn An toàn máy tính (3 TC | Khối V.1 Bắt buộc | 3.5/5 sao ★★★☆☆): Bảo mật phần mềm, tấn công Buffer Overflow, SQL Injection, tường lửa, IDS/IPS. Huân đã có điểm A môn Linux (8.7) nên học môn này sẽ rất thuận lợi.",
        "MAT3375": "Môn Hệ thống nhúng (3 TC | Khối V.1 Bắt buộc | 4/5 sao ★★★★☆): Lập trình C nhúng trên vi điều khiển ARM/ESP32, ngắt, timer, giao tiếp UART/I2C/SPI và RTOS. Học sau môn Kiến trúc máy tính.",
        "MAT4080": "Môn Khóa luận tốt nghiệp (7 TC | Khối V.3 Tốt nghiệp | 3.5/5 sao ★★★☆☆): Sinh viên có CPA Giỏi như Huân (3.26) được ưu tiên làm Khóa luận tốt nghiệp với thầy cô. Điểm Khóa luận đa số đạt A (3.7) hoặc A+ (4.0), kéo vọt CPA toàn khóa lên rất cao. Khuyên làm đề tài về NLP / LLM."
    }

    for c in db["courses"]:
        code = c["code"]
        st = courses_state.get(code, {})
        is_comp = st.get("completed", c.get("completed", False))
        is_in_p = st.get("in_progress", False) and not is_comp

        rev = course_reviews.get(code, "")
        prereqs = ", ".join(c.get("prerequisites", [])) if c.get("prerequisites") else "Không có môn tiên quyết"
        status_txt = f"Đã học (Điểm 10: {st.get('score10', c.get('score10'))}, Điểm chữ: {st.get('letter', c.get('letter'))})" if is_comp else ("Đang học ở Kỳ 5" if is_in_p else f"Chưa học (Dự kiến Kỳ {st.get('planned_semester', c.get('recommended_semester'))})")

        content = (
            f"Mã học phần: {code} - Tên tiếng Việt: {c['name_vi']} - Tên tiếng Anh: {c['name_en']}.\n"
            f"Số tín chỉ: {c['credits']} TC. Phân loại: {c['block_name']} ({c['type']}, Khối {c['sub_block']}). Ngôn ngữ: {c['language']}.\n"
            f"Môn tiên quyết: {prereqs}. Trạng thái của Huân: {status_txt}.\n"
        )
        if rev:
            content += f"Đánh giá & Review Góc nhìn HUS: {rev}\n"
        if st.get("note"):
            content += f"Ghi chú cá nhân của Huân: {st['note']}\n"
        if st.get("teacher_note"):
            content += f"Lưu ý Giảng viên đã lưu: {st['teacher_note']}\n"

        chunks.append(RAGChunk(
            chunk_id=f"course-{code.lower()}",
            title=f"Đề cương & Đánh giá môn {code} ({c['name_vi']})",
            category="course",
            content=content.strip(),
            course_code=code
        ))

    # 6. Dynamic User Memories Chunk
    custom_mems = progress.get("custom_memories", [])
    for idx, mem in enumerate(custom_mems):
        chunks.append(RAGChunk(
            chunk_id=f"mem-{mem.get('id', idx)}",
            title=f"Kinh nghiệm & Ghi nhớ do Huân nạp: {mem.get('topic')}",
            category="memory",
            content=f"Chủ đề: {mem.get('topic')}\nMôn liên quan: {mem.get('course_code') or 'Chung'}\nNội dung: {mem.get('content')}\nThời gian: {mem.get('created_at')}",
            course_code=mem.get("course_code")
        ))

    return chunks


class HUSAcademicRAG:
    def __init__(self):
        self.chunks: List[RAGChunk] = []
        self.embeddings: Optional[np.ndarray] = None
        self.chunk_ids: List[str] = []
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self._load_or_build_index()

    def _load_or_build_index(self):
        if not os.path.exists("data/academic_database.json") or not os.path.exists("data/user_progress.json"):
            return

        with open("data/academic_database.json", "r", encoding="utf-8") as f:
            db = json.load(f)
        with open("data/user_progress.json", "r", encoding="utf-8") as f:
            progress = json.load(f)

        self.chunks = build_curriculum_rag_chunks(db, progress)
        self.chunk_ids = [c.chunk_id for c in self.chunks]

        if os.path.exists(RAG_EMBEDDINGS_PATH) and os.path.exists(RAG_CHUNKS_PATH):
            try:
                with open(RAG_CHUNKS_PATH, "r", encoding="utf-8") as f:
                    saved_metadata = json.load(f)
                data = np.load(RAG_EMBEDDINGS_PATH)
                if len(saved_metadata) == len(self.chunks) and "embeddings" in data:
                    self.embeddings = data["embeddings"]
                    return
            except Exception:
                pass

        self.refresh_embeddings()

    def refresh_embeddings(self):
        if not self.chunks:
            return

        try:
            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            texts = [f"{c.title}\n{c.content}" for c in self.chunks]

            batch_size = 20
            all_vecs = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                resp = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=batch
                )
                for item in resp.embeddings:
                    all_vecs.append(item.values)

            self.embeddings = np.array(all_vecs, dtype=np.float32)

            norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1e-10
            self.embeddings = self.embeddings / norms

            os.makedirs("data", exist_ok=True)
            np.savez_compressed(RAG_EMBEDDINGS_PATH, embeddings=self.embeddings)
            with open(RAG_CHUNKS_PATH, "w", encoding="utf-8") as f:
                json.dump([c.to_dict() for c in self.chunks], f, ensure_ascii=False, indent=2)
            print(f"[RAG] Successfully indexed {len(self.chunks)} knowledge chunks with Gemini Embeddings (3072-dim).")
        except Exception as e:
            print(f"[RAG] Gemini embedding creation notice: {e}.")
            self.embeddings = None

    def _embed_query(self, query: str) -> Optional[np.ndarray]:
        try:
            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            resp = client.models.embed_content(
                model="gemini-embedding-001",
                contents=query
            )
            vec = np.array(resp.embedding.values, dtype=np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            return vec
        except Exception:
            return None

    def _lexical_score(self, query: str, chunk: RAGChunk) -> float:
        q_low = query.lower()
        score = 0.0

        if chunk.course_code:
            code_low = chunk.course_code.lower()
            if code_low in q_low:
                score += 15.0

        teachers = ["thầy phan", "thầy dũng", "thầy thụy", "hà quang thụy", "cô"]
        for t in teachers:
            if t in q_low and t in chunk.content.lower():
                score += 12.0

        acronyms = {
            "daa": "MAT3552E",
            "oop": "MAT1202",
            "ml": "MAT3533",
            "nlp": "MAT3561E",
            "csdl": "MAT3507",
            "xstk": "MAT2323",
            "đstt": "MAT2400",
            "ktmt": "MAT3505",
            "mmt": "MAT3506",
            "ptvp": "MAT2403",
            "kltn": "MAT4080",
            "nckh": "nlp"
        }
        for acr, target in acronyms.items():
            if re.search(rf"\b{re.escape(acr)}\b", q_low):
                if target.lower() in (chunk.course_code or "").lower() or target.lower() in chunk.content.lower():
                    score += 14.0

        q_tokens = set(re.findall(r"\w+", q_low))
        c_tokens = set(re.findall(r"\w+", chunk.content.lower() + " " + chunk.title.lower()))
        common = q_tokens.intersection(c_tokens)
        score += len(common) * 1.5

        return score

    def retrieve(self, query: str, top_k: int = 5) -> List[Tuple[RAGChunk, float]]:
        if not self.chunks:
            return []

        q_low = query.lower()
        dense_scores = np.zeros(len(self.chunks), dtype=np.float32)
        q_vec = self._embed_query(query)

        if q_vec is not None and self.embeddings is not None and len(self.embeddings) == len(self.chunks):
            dense_scores = np.dot(self.embeddings, q_vec)

        # Lexical scoring
        lex_scores = np.array([self._lexical_score(query, c) for c in self.chunks], dtype=np.float32)

        # Boost specific chunks based on intent
        if any(w in q_low for w in ["mấy môn", "bao nhiêu môn", "bảng điểm", "điểm a", "cpa", "tích lũy", "học cải thiện", "d+"]):
            for i, c in enumerate(self.chunks):
                if c.chunk_id == "profile-huan-transcript":
                    lex_scores[i] += 25.0

        if any(w in q_low for w in ["kỳ 5", "kì 5", "thời khóa biểu", "tkb", "đang học"]):
            for i, c in enumerate(self.chunks):
                if c.chunk_id == "semester5-in-progress":
                    lex_scores[i] += 20.0

        if any(w in q_low for w in ["nlp", "nckh", "nghiên cứu khoa học", "bài báo"]):
            for i, c in enumerate(self.chunks):
                if c.chunk_id == "nlp-research-workspace":
                    lex_scores[i] += 20.0

        if lex_scores.max() > 0:
            lex_norm = lex_scores / lex_scores.max()
        else:
            lex_norm = lex_scores

        final_scores = 0.65 * dense_scores + 0.35 * lex_norm
        top_indices = np.argsort(final_scores)[::-1][:top_k]
        results = [(self.chunks[i], float(final_scores[i])) for i in top_indices if final_scores[i] > 0.05]
        return results

    def get_status(self) -> Dict[str, Any]:
        return {
            "indexed_chunks_count": len(self.chunks),
            "has_embeddings": self.embeddings is not None,
            "embedding_model": "gemini-embedding-001 (3072-dim)",
            "categories": list(set(c.category for c in self.chunks))
        }


# Singleton instance
rag_engine = HUSAcademicRAG()
