import os
import re
import json
import uuid
import asyncio
import tempfile
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openpyxl

from scripts.build_database import (
    parse_excel_and_build_db,
    EXCEL_NAME_TO_CODE,
    score10_to_grade,
)
from backend.rag_engine import rag_engine

load_dotenv()

app = FastAPI(
    title="HUS CIS Academic Navigator & AI Advisor API",
    description="Backend API cho hệ thống quản lý tiến độ học tập, không gian Kỳ 5 & NCKH NLP, cây môn học kép, mô phỏng CPA và cố vấn AI ngành Khoa học máy tính và thông tin (7480113QTD) - HUS.",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/academic_database.json"
PROGRESS_PATH = "data/user_progress.json"

COURSE_SYLLABUS_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    "MAT3519": {
        "stars": 4.0,
        "difficulty": "4/5 sao (★★★★☆) - Khá khó nếu chưa quen cú pháp nâng cao",
        "topics": "Lập trình ngôn ngữ thứ hai (Python nâng cao / Java / C#), xử lý ngoại lệ, đa luồng, thao tác tệp, thư viện chuẩn và xây dựng ứng dụng thực tế.",
        "review_hus": "Theo review Góc nhìn HUS: Khối lượng bài tập tuần khá nhiều, chấm code tự động trên hệ thống gắt.",
        "tips": "Hiện tại trong lịch Kỳ 5 bạn đang ghi chú 'Khó, khả năng bỏ'. Vì đây là môn Tự chọn V.2.1 (chỉ cần chọn 4/8 TC trong 4 môn: MAT3519, MAT3558, MAT1208, MAT3560), nếu thấy tốn thời gian làm NCKH NLP thì bạn có thể rút học phần này và chọn Lập trình di động (MAT3558 - 2 sao) + Phát triển game (MAT3560 - 2 sao) ở Kỳ 6."
    },
    "MAT1206E": {
        "stars": 3.0,
        "difficulty": "3/5 sao (★★★☆☆) - Vừa sức, rất thú vị & nền tảng cho NCKH NLP",
        "topics": "Các thuật toán tìm kiếm mù (BFS, DFS, UCS), tìm kiếm có thông tin (Greedy, A*), tìm kiếm đối kháng (Minimax, Alpha-Beta Pruning), bài toán thỏa mãn ràng buộc (CSP), Logic mệnh đề/vị từ và suy diễn xác suất Bayes.",
        "review_hus": "Theo review Góc nhìn HUS: Môn học bằng tiếng Anh (mã E) nhưng slide rất dễ hiểu, thầy cô tạo điều kiện cộng điểm bài tập thực hành.",
        "tips": "Môn này cực kỳ hợp với lợi thế Tiếng Anh B1 (10.0 A+) và Xác suất thống kê (8.8 A) của bạn, đồng thời bổ trợ tư duy biểu diễn tri thức cho đề tài NCKH NLP."
    },
    "MAT3533": {
        "stars": 4.0,
        "difficulty": "4/5 sao (★★★★☆) - Hơi khó phần Toán tối ưu nhưng là môn TỦ cho NCKH NLP",
        "topics": "Hồi quy tuyến tính (Linear Regression), Hồi quy Logistic, Cây quyết định (Decision Tree), Random Forest, Máy vector hỗ trợ (SVM), Phân cụm K-Means, Giảm chiều dữ liệu PCA và Mạng nơ-ron cơ bản.",
        "review_hus": "Theo review Góc nhìn HUS: Cần nắm chắc bản chất đạo hàm ma trận, xác suất Bayes và thực hành scikit-learn/PyTorch.",
        "tips": "Bạn có điểm Giải tích (8.7, 8.7, 10.0) và Xác suất thống kê (8.8 A) rất cao, cộng với việc đang làm NCKH về NLP ở Kỳ 5 nên sẽ tiếp thu môn này cực nhanh. Ghi chú giảng viên đã lưu: Nên học thầy Hà Quang Thụy vì thầy dạy rất sâu sắc."
    },
    "MAT3506": {
        "stars": 3.0,
        "difficulty": "3/5 sao (★★★☆☆) - Trung bình, thiên về lý thuyết hệ thống & thực hành Wireshark/Socket",
        "topics": "Mô hình OSI & TCP/IP 5 tầng: Tầng Ứng dụng (HTTP, DNS, SMTP, lập trình Socket), Tầng Giao vận (TCP, UDP, kiểm soát tắc nghẽn), Tầng Mạng (IPv4/IPv6, chia Subnet, thuật toán định tuyến Dijkstra/Bellman-Ford), Tầng Liên kết dữ liệu.",
        "review_hus": "Theo review Góc nhìn HUS: Đề thi rất sát slide, trọng tâm là chia mạng con (Subnetting) và phân tích gói tin TCP.",
        "tips": "Chăm chỉ đi học chiều Thứ 5 tại phòng 302T5, nắm chắc bài toán chia Subnet và định tuyến là đạt điểm A."
    },
    "MAT3505": {
        "stars": 3.0,
        "difficulty": "3/5 sao (★★★☆☆) - Trung bình, cần hiểu logic phần cứng & tập lệnh",
        "topics": "Biểu diễn dữ liệu nhị phân/số dấu phẩy động, Đại số Boole, Mạch tổ hợp & tuần tự, Kiến trúc tập lệnh (ISA - MIPS/RISC-V), Đường ống lệnh (Pipelining), Bộ nhớ đệm (Cache) và Bộ nhớ ảo.",
        "review_hus": "Theo review Góc nhìn HUS: Bài tập tính địa chỉ Cache (Direct-mapped, Set-associative) và đọc lệnh hợp ngữ MIPS chắc chắn có trong đề thi.",
        "tips": "Chú ý làm kỹ các bài tập tính địa chỉ Cache tại lớp 513T4 (Thứ 6) và 102T5 (Sáng Thứ 7)."
    },
    "THL1057": {
        "stars": 1.0,
        "difficulty": "1/5 sao (★☆☆☆☆) - Rất dễ, nhẹ nhàng",
        "topics": "Nguồn gốc bản chất Nhà nước và Pháp luật, Hiến pháp, Luật Hành chính, Luật Dân sự, Luật Hình sự, Luật Lao động và phòng chống tham nhũng.",
        "review_hus": "Theo review Góc nhìn HUS: Môn đại cương nhẹ nhàng nhất trường, học online, đề thi mở hoặc trắc nghiệm cơ bản.",
        "tips": "Điểm danh đầy đủ sáng Thứ 5 (Tiết 4-5 Online) và làm bài kiểm tra cẩn thận là lấy A/A+ để khóa sổ hoàn toàn Khối I (21/21 TC)."
    },
    "MAT2407": {
        "stars": 4.0,
        "difficulty": "4/5 sao (★★★★☆) - Khá nặng tính toán nhưng rất hợp sở trường Giải tích của Huân",
        "topics": "Quy hoạch tuyến tính (Phương pháp đơn hình Simplex, bài toán đối ngẫu), Tối ưu không ràng buộc (Gradient Descent, Newton), Quy hoạch lồi và nhân tử Lagrange.",
        "review_hus": "Theo review Góc nhìn HUS và kinh nghiệm của bạn: Môn Tối ưu hóa NÊN HỌC THẦY PHAN, KHÔNG NÊN HỌC THẦY DŨNG. Tính toán bảng Simplex cần cẩn thận tránh nhầm số.",
        "tips": "Học kỳ 6 nên đăng ký lớp của thầy Phan. Với nền Giải tích 1, 2, 3 (8.7, 8.7, 10.0) cực đỉnh của bạn, môn này còn giúp bạn hiểu sâu tối ưu hóa hàm mất mát trong Học sâu & NLP."
    },
    "MAT1204": {
        "stars": 2.0,
        "difficulty": "2/5 sao (★★☆☆☆) - Dễ đạt điểm A/A+, nhất là khi bạn đang làm NCKH NLP!",
        "topics": "Cách tìm kiếm tổng quan tài liệu khoa học (Literature Review), cấu trúc bài báo/khóa luận chuẩn IMRAD, trích dẫn tài liệu (LaTeX/BibTeX), đạo đức nghiên cứu và kỹ năng thuyết trình khoa học.",
        "review_hus": "Theo review Góc nhìn HUS: Không phải thi thuật toán nặng, đánh giá qua tiểu luận nghiên cứu và thuyết trình.",
        "tips": "Vì bạn đang làm Nghiên cứu khoa học về NLP ngay trong Kỳ 5, đến Kỳ 6 học môn này bạn có thể dùng chính đề tài NCKH NLP của mình để làm báo cáo — vừa nhàn vừa nắm chắc điểm A+!"
    },
    "MAT3374": {
        "stars": 3.0,
        "difficulty": "3/5 sao (★★★☆☆) - Thực hành làm dự án nhóm",
        "topics": "Quy trình phát triển phần mềm thực tế (Agile/Scrum), sử dụng Git/GitHub, thiết kế CSDL, xây dựng Backend/Frontend và kiểm thử sản phẩm.",
        "review_hus": "Theo review Góc nhìn HUS: Chấm điểm theo sản phẩm demo nhóm, chọn đồng đội tốt là có điểm A.",
        "tips": "Đây là môn tiên quyết bắt buộc để mở khóa MAT1207 (Công nghệ phần mềm). Bạn có thể đưa mô hình NLP của mình thành Web App trong môn này để ăn điểm sáng tạo!"
    },
    "MAT3552E": {
        "stars": 4.0,
        "difficulty": "4/5 sao (★★★★☆) - Khá thử thách tư duy thuật toán (DAA - Design and Analysis of Algorithms)",
        "topics": "Phân tích độ phức tạp tiệm cận (Big-O, Master Theorem), Chia để trị (Divide & Conquer), Quy hoạch động nâng cao (Dynamic Programming), Thuật toán tham lam (Greedy), Đồ thị nâng cao (Luồng cực đại) và lớp bài toán NP-Đầy đủ (NP-Completeness).",
        "review_hus": "Theo review Góc nhìn HUS: Đây là một trong những môn cốt lõi khó nhất khối V.1 (4/5 sao). Phần Quy hoạch động (DP) và chứng minh tính đúng đắn thuật toán Tham lam phân loại sinh viên rất mạnh.",
        "tips": "Trước khi học môn DAA (MAT3552E) ở Kỳ 6, bạn hãy ôn kỹ lại CTDL & TT (MAT3514 - bạn được 7.4 B) và Toán rời rạc (MAT3500 - 7.0 B). Luyện trước 15-20 bài Dynamic Programming và Divide & Conquer cổ điển là sẽ vượt qua dễ dàng với điểm B+/A."
    },
    "MAT1207": {
        "stars": 3.0,
        "difficulty": "3/5 sao (★★★☆☆) - Vừa sức, thiên về quy trình & thiết kế hệ thống",
        "topics": "Vòng đời phát triển phần mềm (SDLC), đặc tả yêu cầu (SRS), biểu đồ UML (Use Case, Class, Sequence), kiến trúc phần mềm, kiểm thử (Unit/Integration Test) và CI/CD.",
        "review_hus": "Theo review Góc nhìn HUS: Làm bài tập lớn theo nhóm và thi lý thuyết vừa sức.",
        "tips": "Yêu cầu phải học xong MAT3374 (Thực tập thực tế PTPM) trước."
    },
    "MAT3373E": {
        "stars": 3.5,
        "difficulty": "3.5/5 sao (★★★☆☆) - Vừa phải, kết hợp lý thuyết bảo mật & lab Linux",
        "topics": "Các lỗ hổng phần mềm (Buffer Overflow, SQL Injection, XSS, CSRF), kiểm soát truy cập, tường lửa, phát hiện xâm nhập (IDS/IPS) và bảo mật hệ điều hành.",
        "review_hus": "Theo review Góc nhìn HUS: Rất thú vị nếu đã có nền Linux tốt.",
        "tips": "Bạn đã đạt điểm A (8.7) môn Môi trường lập trình Linux (MAT3557) nên học môn này sẽ rất thuận lợi."
    },
    "MAT3375": {
        "stars": 4.0,
        "difficulty": "4/5 sao (★★★★☆) - Khá khó vì làm việc sát phần cứng & vi điều khiển",
        "topics": "Kiến trúc vi điều khiển (ARM/ESP32/Arduino), lập trình C nhúng, ngắt (Interrupts), Timer, giao tiếp ngoại vi (UART, I2C, SPI) và hệ điều hành thời gian thực (RTOS).",
        "review_hus": "Theo review Góc nhìn HUS: Cần học chắc Kiến trúc máy tính (MAT3505) và Nguyên lý hệ điều hành (MAT3550E).",
        "tips": "Học ở Kỳ 7 sau khi đã hoàn thành Kiến trúc máy tính ở Kỳ 5."
    },
    "MAT3561E": {
        "stars": 3.5,
        "difficulty": "3.5/5 sao (★★★☆☆) - Môn TỦ SỐ 1 cho hướng NCKH NLP của Huân!",
        "topics": "Tiền xử lý văn bản, Mô hình ngôn ngữ N-gram, Word Embeddings (Word2Vec, GloVe), mạng RNN/LSTM/GRU, cơ chế Attention, kiến trúc Transformer (BERT, GPT) và các bài toán Phân loại văn bản, NER, Dịch máy, Hỏi đáp.",
        "review_hus": "Theo review Góc nhìn HUS: Môn học cực kỳ thời sự, điểm đồ án cuối kỳ chiếm trọng số lớn. Sinh viên đang làm NCKH về NLP gần như nắm chắc điểm A/A+.",
        "tips": "Đăng ký ngay ở Kỳ 6! Toàn bộ kiến thức và thực nghiệm từ đề tài NCKH NLP ở Kỳ 5 của bạn sẽ giúp bạn đạt A+ môn này một cách xuất sắc."
    },
    "MAT3534": {
        "stars": 3.0,
        "difficulty": "3/5 sao (★★★☆☆) - Vừa sức, dễ lấy A nhờ nền CSDL & Xác suất",
        "topics": "Tiền xử lý dữ liệu lớn, Khai phá luật kết hợp (Apriori, FP-Growth), Phân lớp, Phân cụm nâng cao (DBSCAN, Hierarchical), Phát hiện bất thường.",
        "review_hus": "Theo review Góc nhìn HUS: Đồ án thực tế trên tập dữ liệu sẵn có, thầy cô chấm điểm rất thoáng.",
        "tips": "Rất hợp với điểm A CSDL (8.5) và XSTK (8.8) của bạn, lại bổ trợ tốt cho tiền xử lý dữ liệu văn bản trong NLP."
    },
    "MAT3535": {
        "stars": 2.0,
        "difficulty": "2/5 sao (★★☆☆☆) - Nhẹ nhàng, liên quan mật thiết tới NLP & RAG",
        "topics": "Chỉ mục ngược (Inverted Index), mô hình không gian vector, độ đo TF-IDF, BM25, đánh giá hệ thống truy hồi (Precision, Recall, MAP, NDCG) và tìm kiếm ngữ nghĩa.",
        "review_hus": "Theo review Góc nhìn HUS: Một trong những môn tự chọn V.2.2 dễ đạt điểm A nhất và cực kỳ bổ ích cho sinh viên làm NLP / RAG.",
        "tips": "Khuyên chọn số 1 cho Huân ở Kỳ 6 hoặc Kỳ 7 vì Tìm kiếm thông tin chính là nền tảng của hệ thống RAG trong NLP!"
    },
    "MAT3558": {
        "stars": 2.0,
        "difficulty": "2/5 sao (★★☆☆☆) - Dễ lấy A, làm đồ án ứng dụng di động",
        "topics": "Xây dựng giao diện Mobile (Flutter / React Native / Android), quản lý trạng thái, kết nối REST API và lưu trữ cục bộ.",
        "review_hus": "Theo review Góc nhìn HUS: Môn tự chọn V.2.1 nhẹ nhàng và dễ kéo GPA nhất.",
        "tips": "Nên chọn để hoàn thành đủ 4/8 TC khối V.2.1."
    },
    "MAT3560": {
        "stars": 2.0,
        "difficulty": "2/5 sao (★★☆☆☆) - Vui, chấm đồ án thoáng, dễ đạt A",
        "topics": "Vòng lặp game (Game Loop), vật lý 2D/3D, xử lý va chạm, hoạt ảnh, âm thanh và kịch bản game trên Unity/Godot.",
        "review_hus": "Theo review Góc nhìn HUS: Làm đồ án nhóm làm game mini rất vui, thầy cô khuyến khích điểm A/A+.",
        "tips": "Nên chọn cặp MAT3558 + MAT3560 nếu bạn muốn lấy trọn 4 TC khối V.2.1 nhẹ nhàng."
    },
    "MAT1202": {
        "stars": 3.0,
        "difficulty": "3/5 sao (★★★☆☆) - Môn duy nhất bạn đang đạt D+ (5.4) được phép học cải thiện",
        "topics": "4 tính chất OOP (Đóng gói, Kế thừa, Đa hình, Trừu tượng), Constructor/Destructor, Interface, Abstract Class, Generic và Design Patterns.",
        "review_hus": "Theo review Góc nhìn HUS: Khi học lại lần 2 đã quen code Java/C++ thì rất dễ kéo từ D+ lên A hoặc A+.",
        "tips": "Đây là môn DUY NHẤT trong bảng điểm của bạn có điểm D+ (1.5 hệ 4) được phép đăng ký học cải thiện theo quy chế ĐHQGHN. Cải thiện môn này từ D+ lên A/A+ sẽ đẩy CPA của bạn tăng vọt +0.09 đến +0.11 điểm!"
    }
}

COURSE_ALIASES: Dict[str, str] = {
    "daa": "MAT3552E",
    "thiết kế và đánh giá thuật toán": "MAT3552E",
    "thiết kế thuật toán": "MAT3552E",
    "đánh giá thuật toán": "MAT3552E",
    "tk&đgtt": "MAT3552E",
    "tkđgtt": "MAT3552E",
    "nnlt thứ 2": "MAT3519",
    "ngôn ngữ lập trình thứ 2": "MAT3519",
    "ngôn ngữ lập trình thứ hai": "MAT3519",
    "trí tuệ nhân tạo": "MAT1206E",
    "nhập môn ai": "MAT1206E",
    "môn ai": "MAT1206E",
    "học máy": "MAT3533",
    "machine learning": "MAT3533",
    "ml": "MAT3533",
    "mạng máy tính": "MAT3506",
    "mmt": "MAT3506",
    "kiến trúc máy tính": "MAT3505",
    "kiến trúc mt": "MAT3505",
    "ktmt": "MAT3505",
    "nhà nước và pháp luật": "THL1057",
    "nnplđc": "THL1057",
    "pháp luật đại cương": "THL1057",
    "tối ưu hóa": "MAT2407",
    "tối ưu": "MAT2407",
    "lập trình hướng đối tượng": "MAT1202",
    "oop": "MAT1202",
    "hướng đối tượng": "MAT1202",
    "thực tập thực tế": "MAT3374",
    "thực tập phần mềm": "MAT3374",
    "công nghệ phần mềm": "MAT1207",
    "cnpm": "MAT1207",
    "khai phá dữ liệu": "MAT3534",
    "data mining": "MAT3534",
    "kpdl": "MAT3534",
    "thị giác máy tính": "MAT3562E",
    "computer vision": "MAT3562E",
    "xử lý ngôn ngữ tự nhiên": "MAT3561E",
    "xử lí ngôn ngữ tự nhiên": "MAT3561E",
    "nlp": "MAT3561E",
    "an toàn máy tính": "MAT3373E",
    "atmt": "MAT3373E",
    "hệ thống nhúng": "MAT3375",
    "nhúng": "MAT3375",
    "mật mã": "MAT3539",
    "giải tích số": "MAT2034",
    "gts": "MAT2034",
    "thống kê nhiều chiều": "MAT3452",
    "tìm kiếm thông tin": "MAT3535",
    "ir": "MAT3535",
    "di động": "MAT3558",
    "mobile": "MAT3558",
    "trò chơi": "MAT3560",
    "làm game": "MAT3560",
    "nghiên cứu khoa học": "MAT1204",
    "ppnckh": "MAT1204",
    "khóa luận": "MAT4080",
    "kltn": "MAT4080",
    "ctdl": "MAT3514",
    "cấu trúc dữ liệu": "MAT3514",
    "toán rời rạc": "MAT3500",
    "trr": "MAT3500",
    "xác suất thống kê": "MAT2323",
    "xstk": "MAT2323",
    "cơ sở dữ liệu": "MAT3507",
    "csdl": "MAT3507",
    "hệ điều hành": "MAT3550E",
    "hđh": "MAT3550E",
    "đại số tuyến tính": "MAT2400",
    "đstt": "MAT2400",
    "phương trình vi phân": "MAT2403",
    "ptvp": "MAT2403"
}

def strip_markdown_stars(text: str) -> str:
    if not text:
        return ""
    return text.replace("**", "").replace("__", "").replace("`", "")

def ensure_data_files():
    if not os.path.exists(DB_PATH) or not os.path.exists(PROGRESS_PATH):
        parse_excel_and_build_db()

def load_db() -> Dict[str, Any]:
    ensure_data_files()
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def load_progress() -> Dict[str, Any]:
    ensure_data_files()
    with open(PROGRESS_PATH, "r", encoding="utf-8") as f:
        progress = json.load(f)

    # Clean out any accidental questions that were saved as memories previously
    question_words = ["thầy nào", "cô nào", "khó không", "sao không", "gì không", "ở đâu", "khi nào", "mấy môn", "bao nhiêu"]
    raw_mems = progress.get("custom_memories", [])
    cleaned_mems = [
        m for m in raw_mems
        if not any(qw in m.get("content", "").lower() for qw in question_words) and not m.get("content", "").strip().endswith("?")
    ]
    if len(cleaned_mems) != len(raw_mems):
        progress["custom_memories"] = cleaned_mems
        save_progress(progress)

    return progress

def save_progress(progress: Dict[str, Any]):
    os.makedirs("data", exist_ok=True)
    with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

class ProgressUpdateRequest(BaseModel):
    courses_state: Optional[Dict[str, Any]] = None
    conditional_checklist: Optional[Dict[str, bool]] = None
    selected_interests: Optional[List[str]] = None
    graduation_option: Optional[str] = None
    target_cpa: Optional[float] = None
    retake_plan: Optional[Dict[str, Any]] = None
    semester5_timetable: Optional[List[Dict[str, Any]]] = None
    custom_memories: Optional[List[Dict[str, Any]]] = None
    semester5_tasks: Optional[List[Dict[str, Any]]] = None
    nlp_research: Optional[Dict[str, Any]] = None

class AddMemoryRequest(BaseModel):
    topic: str
    course_code: Optional[str] = None
    content: str

class AIAdvisorRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []
    api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    custom_context: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "student": "Phạm Ngọc Huân", "major": "7480113QTD - HUS"}

@app.get("/api/rag/status")
def get_rag_status():
    return rag_engine.get_status()

@app.post("/api/rag/reindex")
def reindex_rag():
    rag_engine._load_or_build_index()
    rag_engine.refresh_embeddings()
    return rag_engine.get_status()

@app.get("/api/data")
def get_all_data():
    db = load_db()
    progress = load_progress()
    return {
        "database": db,
        "user_progress": progress,
        "ai_config": {
            "has_default_key": bool(os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY")),
            "default_base_url": os.getenv("AI_BASE_URL", "https://agentrouter.org/v1"),
            "default_model": os.getenv("AI_MODEL", "gemini-3.5-flash-lite"),
            "default_gemini_key": os.getenv("GEMINI_API_KEY", ""),
            "supported_models": [
                "gemini-3.8-flash",
                "gemini-4-argon",
                "gpt-5.6-sol",
                "gpt-6-astra",
                "gpt-6.1-sol"
            ]
        }
    }

@app.post("/api/progress")
def update_user_progress(req: ProgressUpdateRequest):
    progress = load_progress()
    if req.courses_state is not None:
        progress["courses_state"] = req.courses_state
    if req.conditional_checklist is not None:
        progress["conditional_checklist"] = req.conditional_checklist
    if req.selected_interests is not None:
        progress["selected_interests"] = req.selected_interests
    if req.graduation_option is not None:
        progress["graduation_option"] = req.graduation_option
    if req.target_cpa is not None:
        progress["target_cpa"] = req.target_cpa
    if req.retake_plan is not None:
        progress["retake_plan"] = req.retake_plan
    if req.semester5_timetable is not None:
        progress["semester5_timetable"] = req.semester5_timetable
    if req.custom_memories is not None:
        progress["custom_memories"] = req.custom_memories
    if req.semester5_tasks is not None:
        progress["semester5_tasks"] = req.semester5_tasks
    if req.nlp_research is not None:
        progress["nlp_research"] = req.nlp_research
    save_progress(progress)
    return {"status": "saved", "user_progress": progress}

@app.post("/api/memories")
def add_custom_memory(req: AddMemoryRequest):
    progress = load_progress()
    memories = progress.get("custom_memories", [])
    new_mem = {
        "id": f"mem-{uuid.uuid4().hex[:8]}",
        "topic": req.topic.strip(),
        "course_code": req.course_code.strip().upper() if req.course_code else None,
        "content": req.content.strip(),
        "created_at": datetime.now().strftime("%d/%m/%Y %H:%M")
    }
    memories.insert(0, new_mem)
    progress["custom_memories"] = memories

    if new_mem["course_code"] and new_mem["course_code"] in progress.get("courses_state", {}):
        st = progress["courses_state"][new_mem["course_code"]]
        existing_tn = st.get("teacher_note", "")
        if new_mem["content"] not in existing_tn:
            st["teacher_note"] = (existing_tn + " | " + new_mem["content"]).strip(" |")

    save_progress(progress)
    return {"status": "added", "memory": new_mem, "custom_memories": memories, "user_progress": progress}

@app.delete("/api/memories/{memory_id}")
def delete_custom_memory(memory_id: str):
    progress = load_progress()
    memories = [m for m in progress.get("custom_memories", []) if m.get("id") != memory_id]
    progress["custom_memories"] = memories
    save_progress(progress)
    return {"status": "deleted", "custom_memories": memories}

@app.post("/api/reset")
def reset_to_ground_truth():
    parse_excel_and_build_db()
    return get_all_data()

@app.post("/api/import-excel")
async def import_excel_file(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Vui lòng tải lên file định dạng Excel (.xlsx)")

    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        wb = openpyxl.load_workbook(tmp_path, data_only=True)
        ws = wb["Update lần 6"] if "Update lần 6" in wb.sheetnames else wb.active

        db = load_db()
        progress = load_progress()
        courses_state = progress.get("courses_state", {})

        imported_count = 0
        for r in range(13, 80):
            sem_str = ws.cell(r, 2).value
            raw_name = ws.cell(r, 3).value
            credits = ws.cell(r, 4).value
            score10 = ws.cell(r, 5).value
            letter = ws.cell(r, 6).value
            score4 = ws.cell(r, 7).value

            if raw_name is None or score10 is None:
                continue
            norm_name = str(raw_name).strip().lower()
            code = EXCEL_NAME_TO_CODE.get(norm_name)
            if not code:
                for c in db["courses"]:
                    if c["code"].lower() == norm_name or c["name_vi"].lower() == norm_name:
                        code = c["code"]
                        break

            if code and code in courses_state:
                sem_num = 1
                if sem_str and "kỳ" in str(sem_str).lower():
                    try:
                        sem_num = int(str(sem_str).lower().replace("kỳ", "").strip())
                    except ValueError:
                        sem_num = 1
                calc_letter, calc_s4 = score10_to_grade(score10)
                prev_st = courses_state.get(code, {})
                courses_state[code] = {
                    **prev_st,
                    "completed": True,
                    "in_progress": False,
                    "score10": round(float(score10), 2),
                    "letter": str(letter).strip() if letter else calc_letter,
                    "score4": round(float(score4), 2) if score4 is not None else calc_s4,
                    "semester": sem_num,
                    "planned_semester": sem_num
                }
                imported_count += 1

        os.remove(tmp_path)
        progress["courses_state"] = courses_state
        save_progress(progress)
        return {
            "status": "imported",
            "imported_courses_count": imported_count,
            "user_progress": progress
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đọc file Excel: {str(e)}")


def find_course_in_text(msg_lower: str, db: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # 1. Exact course code match (word boundary)
    for c in db["courses"]:
        code_low = c["code"].lower()
        if re.search(rf"\b{re.escape(code_low)}\b", msg_lower):
            return c

    # 2. Alias match (longest alias first to avoid partial collision)
    for alias, code in sorted(COURSE_ALIASES.items(), key=lambda x: len(x[0]), reverse=True):
        if re.search(rf"\b{re.escape(alias)}\b", msg_lower) or (len(alias) > 4 and alias in msg_lower):
            found = next((c for c in db["courses"] if c["code"] == code), None)
            if found:
                return found

    # 3. Full Vietnamese/English name substring
    for c in db["courses"]:
        if c["name_vi"].lower() in msg_lower or c["name_en"].lower() in msg_lower:
            return c

    return None


def is_question_sentence(msg_lower: str) -> bool:
    if "?" in msg_lower:
        return True
    question_patterns = [
        "thầy nào", "cô nào", "giảng viên nào", "ai dạy",
        "khó không", "dễ không", "nặng không", "như thế nào", "ra sao",
        "học gì", "học những gì", "nội dung gì", "mấy sao", "bao nhiêu sao",
        "mấy môn", "bao nhiêu môn", "những môn nào", "môn nào",
        "có nên", "làm sao", "thế nào", "tại sao", "vì sao", "khi nào",
        "tôi đang hỏi", "cho tôi hỏi", "hỏi về", "review môn", "đánh giá môn"
    ]
    return any(q in msg_lower for q in question_patterns)


def try_auto_learn_from_message(message: str, db: Dict[str, Any], progress: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Detect ONLY declarative teaching statements from the user (NEVER trigger on questions!).
    Examples that SHOULD trigger:
      - "Ghi nhớ: môn Học máy nên học thầy..."
      - "tối ưu hóa nên học thầy phan, ko nên học thầy dũng"
    Examples that MUST NOT trigger:
      - "môn tối ưu hóa nên học thầy nào" (this is a question!)
    """
    msg_lower = message.lower().strip()

    # CRITICAL FIX: Never auto-learn if the user is asking a question!
    if is_question_sentence(msg_lower):
        return None

    explicit_prefixes = ["nhớ rằng", "ghi nhớ", "lưu ý giúp", "nạp thêm", "cập nhật kiến thức", "ghi chú:"]
    teacher_declarative_patterns = [
        r"(nên học|học)\s+(thầy|cô)\s+[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+",
        r"(không nên học|ko nên học|tránh học)\s+(thầy|cô)\s+[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+"
    ]

    is_teaching = any(p in msg_lower for p in explicit_prefixes) or any(
        re.search(pat, msg_lower) for pat in teacher_declarative_patterns
    )
    if not is_teaching:
        return None

    matched_course = find_course_in_text(msg_lower, db)

    memories = progress.get("custom_memories", [])
    topic_label = (
        f"Ghi chú học tập {matched_course['code']} - {matched_course['name_vi']}"
        if matched_course
        else "Ghi chú & Kinh nghiệm học tập cá nhân"
    )
    new_mem = {
        "id": f"mem-{uuid.uuid4().hex[:8]}",
        "topic": topic_label,
        "course_code": matched_course["code"] if matched_course else "CHUNG",
        "content": message.strip(),
        "created_at": datetime.now().strftime("%d/%m/%Y %H:%M")
    }
    memories.insert(0, new_mem)
    progress["custom_memories"] = memories

    if matched_course and matched_course["code"] in progress.get("courses_state", {}):
        st = progress["courses_state"][matched_course["code"]]
        existing_tn = st.get("teacher_note", "")
        if message.strip() not in existing_tn:
            st["teacher_note"] = (existing_tn + " | " + message.strip()).strip(" |")

    save_progress(progress)
    return new_mem


def format_course_detail_answer(c: Dict[str, Any], db: Dict[str, Any], progress: Dict[str, Any], msg_lower: str) -> str:
    courses_state = progress.get("courses_state", {})
    st = courses_state.get(c["code"], {})
    syl = COURSE_SYLLABUS_KNOWLEDGE.get(c["code"], {})
    prereqs = c.get("prerequisites", [])
    prereq_text = ", ".join(prereqs) if prereqs else "Không yêu cầu môn tiên quyết bắt buộc"
    in_k = [l for l in db["knowledge_links"] if l["target"] == c["code"]]
    out_k = [l for l in db["knowledge_links"] if l["source"] == c["code"]]

    related_mems = [
        m for m in progress.get("custom_memories", [])
        if m.get("course_code") == c["code"]
        or c["code"].lower() in m.get("content", "").lower()
        or c["name_vi"].lower() in m.get("content", "").lower()
    ]

    status_str = (
        f"Đã hoàn thành ở Kỳ {st.get('semester', c['semester'])} (Điểm: {st.get('score10')} - {st.get('letter')})"
        if st.get("completed")
        else (
            f"Đang học trực tiếp ở Kỳ 5 hiện tại ({st.get('schedule_info') or '16 TC'})"
            if st.get("in_progress")
            else f"Chưa học (Dự kiến xếp ở Kỳ {st.get('planned_semester', c['recommended_semester'])})"
        )
    )

    teacher_info = st.get("teacher_note", "").strip()
    mem_texts = [m["content"] for m in related_mems]

    resp = [
        f"ĐÁNH GIÁ CHI TIẾT HỌC PHẦN: {c['code']} - {c['name_vi']} ({c['name_en']} • {c['credits']} tín chỉ)",
        ""
    ]

    # If user specifically asked about teacher ("thầy nào", "cô nào", "giảng viên")
    if any(k in msg_lower for k in ["thầy nào", "cô nào", "giảng viên", "ai dạy", "học thầy", "học cô"]):
        resp.append("1. Gợi ý Giảng viên & Kinh nghiệm chọn lớp:")
        if teacher_info or mem_texts:
            if teacher_info:
                resp.append(f"• Theo ghi chú thực tế bạn đã lưu cho môn {c['code']}: {teacher_info}")
            for mt in mem_texts:
                if mt not in teacher_info:
                    resp.append(f"• Kinh nghiệm đã nạp trong Bộ nhớ: {mt}")
        else:
            resp.append(
                f"• Hiện tại trong bộ nhớ của bạn chưa có ghi chú riêng về giảng viên môn {c['name_vi']} ({c['code']}). "
                f"Theo kinh nghiệm sinh viên Khoa Toán - Cơ - Tin học (Góc nhìn HUS), bạn nên ưu tiên các thầy cô chấm điểm quá trình rõ ràng, có bài tập mẫu sát đề thi."
            )
        resp.append("")

    resp.extend([
        f"• Phân loại học phần: {c['block_name']} ({c['type']}) | Ngôn ngữ: {c['language']}",
        f"• Trạng thái của Huân: {status_str}",
        f"• Điều kiện tiên quyết QĐ 3568: {prereq_text}",
        f"• Độ khó (Xếp hạng Góc nhìn HUS): {syl.get('difficulty', '3/5 sao (★★★☆☆) - Vừa sức, bám sát đề cương QĐ 3568')}",
        f"• Nội dung cốt lõi môn học: {syl.get('topics', f'Trang bị kiến thức nền tảng và thực hành chuyên sâu về {c['name_vi']} ({c['name_en']}), gồm {c['hours']['theory']} giờ lý thuyết và {c['hours']['practice']} giờ thực hành.')}",
        f"• Review cộng đồng sinh viên HUS: {syl.get('review_hus', 'Đi học đầy đủ, làm kỹ bài tập tuần và đề cương giữa/cuối kỳ là đạt B+/A.')}",
        f"• Lời khuyên chiến lược dành riêng cho Huân: {syl.get('tips', 'Kết hợp thế mạnh Giải tích (9.1) và Xác suất thống kê (8.8 A) của bạn để tối ưu điểm A/A+.')}"
    ])

    if teacher_info and not any(k in msg_lower for k in ["thầy nào", "cô nào", "giảng viên"]):
        resp.append(f"• Lưu ý chọn Giảng viên (Đã lưu): {teacher_info}")
    for m in related_mems:
        if m["content"] not in teacher_info:
            resp.append(f"• Ghi chú bộ nhớ ({m['created_at']}): {m['content']}")

    if in_k:
        resp.append("")
        resp.append("Các môn nền tảng bổ trợ trực tiếp cho môn này:")
        for lk in in_k:
            src_st = courses_state.get(lk["source"], {})
            score_badge = f"(Điểm của bạn: {src_st.get('score10')} - {src_st.get('letter')})" if src_st.get("completed") else "(Chưa học)"
            resp.append(f"  - {lk['source']} {score_badge}: {lk['description']}")

    if out_k:
        resp.append("")
        resp.append("Môn này sẽ làm nền tảng mở khóa cho:")
        for lk in out_k:
            resp.append(f"  - {lk['target']}: {lk['label']}")

    return "\n".join(resp)


def generate_smart_expert_response(message: str, db: Dict[str, Any], progress: Dict[str, Any], history: Optional[List[Dict[str, str]]] = None) -> str:
    msg_lower = message.lower().strip()

    # Handle conversational follow-up like "tôi đang hỏi bạn mà", "trả lời đi", "sao lại lưu"
    if any(p in msg_lower for p in ["tôi đang hỏi", "đang hỏi bạn", "trả lời câu hỏi", "hỏi bạn mà"]):
        # Look back in history for the previous user question
        if history:
            for prev in reversed(history):
                if prev.get("role") == "user":
                    prev_text = prev.get("content", "").strip()
                    if prev_text.lower() != msg_lower and "đang hỏi" not in prev_text.lower():
                        prev_course = find_course_in_text(prev_text.lower(), db)
                        if prev_course:
                            return (
                                f"Xin lỗi Huân vì sự nhầm lẫn vừa rồi! Tôi trả lời ngay câu hỏi \"{prev_text}\" của bạn đây:\n\n"
                                + format_course_detail_answer(prev_course, db, progress, prev_text.lower())
                            )

    courses_state = progress.get("courses_state", {})
    completed_courses = []
    in_progress_courses = []

    for c in db["courses"]:
        st = courses_state.get(c["code"], {})
        merged = {
            **c,
            "completed": st.get("completed", c["completed"]),
            "in_progress": st.get("in_progress", False),
            "score10": st.get("score10", c["score10"]),
            "letter": st.get("letter", c["letter"]),
            "score4": st.get("score4", c["score4"]),
            "semester": st.get("semester", c["semester"]),
            "planned_semester": st.get("planned_semester", c["recommended_semester"]),
            "note": st.get("note", ""),
            "teacher_note": st.get("teacher_note", ""),
            "schedule_info": st.get("schedule_info", "")
        }
        if merged["completed"] and c["counts_gpa"]:
            completed_courses.append(merged)
        elif merged["in_progress"] and c["counts_gpa"]:
            in_progress_courses.append(merged)

    total_tc = sum(c["credits"] for c in completed_courses)
    in_prog_tc = sum(c["credits"] for c in in_progress_courses)
    cpa4 = round(sum(c["credits"] * (c["score4"] or 0) for c in completed_courses) / max(total_tc, 1), 2)
    cpa10 = round(sum(c["credits"] * (c["score10"] or 0) for c in completed_courses) / max(total_tc, 1), 2)

    # PRIORITY 1: Check if user mentions ANY specific course (including English acronyms like DAA, OOP, ML, AI, NLP, KTMT, MMT...)
    matched_specific_course = find_course_in_text(msg_lower, db)
    if matched_specific_course:
        return format_course_detail_answer(matched_specific_course, db, progress, msg_lower)

    # PRIORITY 2: Asking about NLP Research (NCKH NLP)
    if any(k in msg_lower for k in ["nckh", "nghiên cứu khoa học", "đề tài nlp", "làm nlp", "bài báo"]):
        nlp_data = progress.get("nlp_research", {})
        return (
            f"CỐ VẤN NGHIÊN CỨU KHOA HỌC (NCKH) VỀ NLP TẠI KỲ 5 CỦA PHẠM NGỌC HUÂN\n\n"
            f"1. Đề tài hiện tại của bạn: {nlp_data.get('topic_title', 'Nghiên cứu Xử lý Ngôn ngữ Tự nhiên Tiếng Việt & LLM/RAG')}\n"
            f"2. Mục tiêu chiến lược: {nlp_data.get('research_goal', 'Công bố báo cáo Hội nghị SV NCKH và phát triển thành Khóa luận tốt nghiệp MAT4080 đạt A+.')}\n"
            f"3. Công cụ & Mô hình gợi ý: {nlp_data.get('datasets_and_models', 'PhoBERT, ViT5, PyTorch, HuggingFace, LangChain, VectorDB')}\n\n"
            f"4. Cách kết hợp NCKH NLP với các môn học để đạt lợi ích kép (Double Benefit):\n"
            f"• Tại Kỳ 5 hiện tại: Dùng ngay bài toán phân loại/biểu diễn văn bản NLP làm đồ án cuối kỳ môn Học máy (MAT3533) và Trí tuệ nhân tạo (MAT1206E).\n"
            f"• Tại Kỳ 6 sắp tới: Đăng ký ngay bộ 3 môn MAT1204 (Phương pháp NCKH - 2 sao), MAT3561E (Xử lí ngôn ngữ tự nhiên - 3.5 sao) và MAT3535 (Tìm kiếm thông tin - 2 sao). Bạn sẽ dùng chính kết quả NCKH NLP Kỳ 5 để lấy điểm A+ cả 3 môn này mà không tốn công làm lại từ đầu!\n"
            f"• Bạn có thể quản lý chi tiết từng mốc tiến độ, link paper và ghi chú thực nghiệm ngay tại mục 'Kỳ 5 Đang Học & NCKH NLP' trên thanh công cụ chính."
        )

    # PRIORITY 3: Asking about specific Letter Grades count/list (e.g., "tôi có mấy môn A rồi", "mấy môn B+")
    grade_query_match = re.search(r"(mấy môn|bao nhiêu môn|những môn nào|liệt kê.*môn|có.*môn)\s*(đạt\s*|điểm\s*)?(a\+|a|b\+|b|c\+|c|d\+|d)\b", msg_lower)
    if grade_query_match or "mấy môn a" in msg_lower or "bao nhiêu điểm a" in msg_lower or "thống kê điểm chữ" in msg_lower:
        by_letter: Dict[str, List[Dict[str, Any]]] = {}
        for l in ["A+", "A", "B+", "B", "C+", "C", "D+", "D"]:
            by_letter[l] = [c for c in completed_courses if (c["letter"] or "").upper() == l]

        a_plus_list = by_letter["A+"]
        a_list = by_letter["A"]
        b_plus_list = by_letter["B+"]
        b_list = by_letter["B"]
        c_plus_list = by_letter["C+"]
        c_list = by_letter["C"]
        d_plus_list = by_letter["D+"]

        if "a" in msg_lower and not any(x in msg_lower for x in ["b+", "c+", "d+"]):
            lines = [
                f"Trong {len(completed_courses)} môn đã hoàn thành ({total_tc} tín chỉ), bạn hiện có tổng cộng {len(a_list) + len(a_plus_list)} môn đạt nhóm điểm A (gồm {len(a_plus_list)} môn đạt điểm A+ và {len(a_list)} môn đạt điểm A):",
                "",
                f"1. Danh sách {len(a_plus_list)} môn đạt điểm A+ (4.0/4.0):"
            ]
            for idx, c in enumerate(a_plus_list, 1):
                lines.append(f"   {idx}. {c['code']} - {c['name_vi']} ({c['credits']} TC, Kỳ {c['semester']}): {c['score10']}/10 (A+)")

            lines.append("")
            lines.append(f"2. Danh sách {len(a_list)} môn đạt điểm A (3.7/4.0):")
            for idx, c in enumerate(a_list, 1):
                lines.append(f"   {idx}. {c['code']} - {c['name_vi']} ({c['credits']} TC, Kỳ {c['semester']}): {c['score10']}/10 (A)")

            lines.append("")
            lines.append(
                f"Tổng hợp phân phối toàn bộ {len(completed_courses)} môn đã học của Huân:\n"
                f"• Điểm A+ (4.0): {len(a_plus_list)} môn ({sum(x['credits'] for x in a_plus_list)} TC)\n"
                f"• Điểm A (3.7): {len(a_list)} môn ({sum(x['credits'] for x in a_list)} TC)\n"
                f"• Điểm B+ (3.5): {len(b_plus_list)} môn ({sum(x['credits'] for x in b_plus_list)} TC)\n"
                f"• Điểm B (3.0): {len(b_list)} môn ({sum(x['credits'] for x in b_list)} TC)\n"
                f"• Điểm C+ (2.5): {len(c_plus_list)} môn ({sum(x['credits'] for x in c_plus_list)} TC)\n"
                f"• Điểm C (2.0): {len(c_list)} môn ({sum(x['credits'] for x in c_list)} TC)\n"
                f"• Điểm D+ (1.5): {len(d_plus_list)} môn ({sum(x['credits'] for x in d_plus_list)} TC - Duy nhất môn MAT1202 Lập trình hướng đối tượng được phép học cải thiện)."
            )
            return "\n".join(lines)

        target_letter = grade_query_match.group(3).upper() if grade_query_match else "A"
        matched = by_letter.get(target_letter, [])
        lines = [f"Bạn hiện có {len(matched)} môn đạt điểm {target_letter} trong bảng điểm:"]
        for idx, c in enumerate(matched, 1):
            lines.append(f"{idx}. {c['code']} - {c['name_vi']} ({c['credits']} TC, Kỳ {c['semester']}): Điểm hệ 10 là {c['score10']} | Hệ 4 là {c['score4']}")
        return "\n".join(lines)

    # PRIORITY 4: Asking about 0-5 Star Difficulty Rankings / Elective Selection / Góc nhìn HUS
    if any(k in msg_lower for k in ["xếp hạng", "độ khó", "mấy sao", "sao", "góc nhìn hus", "môn tự chọn", "dễ chọn", "dễ đạt a", "môn nào dễ"]):
        return (
            "BẢNG XẾP HẠNG ĐỘ KHÓ (0 - 5 SAO) & HƯỚNG DẪN CHỌN MÔN TỰ CHỌN (THAM KHẢO GÓC NHÌN HUS)\n\n"
            "Để hoàn thành 58 tín chỉ còn lại (trong đó bạn đang học 16 TC ở Kỳ 5), bạn cần phân biệt rõ 4 nhóm học phần sau:\n\n"
            "1. NHÓM TỰ CHỌN KỸ NĂNG PHẦN MỀM V.2.1 (Chỉ cần chọn đúng 4/8 tín chỉ - tức 2 trong 4 môn 2 TC):\n"
            "• MAT3558 - Lập trình cho thiết bị di động (2 TC | Độ khó: 2/5 sao ★★☆☆☆ - Khá dễ): Làm app di động thực tế, chấm điểm đồ án thoáng, rất dễ đạt A/A+. Khuyên chọn số 1!\n"
            "• MAT3560 - Phát triển phần mềm trò chơi (2 TC | Độ khó: 2/5 sao ★★☆☆☆ - Khá dễ): Làm game 2D/3D với Unity/Godot, vui và dễ lấy điểm A.\n"
            "• MAT1208 - Mạng không dây (2 TC | Độ khó: 3/5 sao ★★★☆☆ - Vừa sức): Học tiếp nối ngay sau môn Mạng máy tính Kỳ 5.\n"
            "• MAT3519 - Ngôn ngữ lập trình thứ hai (2 TC | Độ khó: 4/5 sao ★★★★☆ - Khá khó): Bạn đang đăng ký ở Kỳ 5 (ghi chú: Khó, khả năng bỏ).\n\n"
            "2. NHÓM TỰ CHỌN CHUYÊN SÂU AI, DỮ LIỆU & PTPM V.2.2 (Chỉ cần chọn 12/39 tín chỉ - tức 4 môn 3 TC):\n"
            "Dựa trên review Góc nhìn HUS, thế mạnh Toán/Xác suất và hướng NCKH NLP của Huân, thứ tự khuyên chọn như sau:\n"
            "• Nhóm 2/5 sao (★★☆☆☆ - Dễ lấy A/A+ nhất):\n"
            "  - MAT3535 - Tìm kiếm thông tin (3 TC): Học về Search Engine, TF-IDF, BM25 — nền tảng trực tiếp của hệ thống RAG trong NLP!\n"
            "  - MAT3542 - Các công nghệ phần mềm tiên tiến (3 TC): Học công nghệ Web/Cloud/DevOps hiện đại.\n"
            "  - MAT3537 - Tin sinh học (3 TC): Áp dụng thuật toán chuỗi, thầy cô chấm rất tạo điều kiện.\n"
            "• Nhóm 3/5 sao (★★★☆☆ - Vừa sức & Đúng sở trường ăn điểm A của Huân - KHUYÊN CHỌN):\n"
            "  - MAT3561E - Xử lí ngôn ngữ tự nhiên (3 TC): Môn TỦ số 1 vì bạn đang làm NCKH về NLP ở Kỳ 5!\n"
            "  - MAT3534 - Khai phá dữ liệu (3 TC): Cực kỳ hợp với điểm A CSDL (8.5) và XSTK (8.8) của bạn.\n"
            "  - MAT3452 - Phân tích thống kê nhiều chiều (3 TC): Môn tủ của sinh viên giỏi Xác suất thống kê.\n"
            "  - MAT2034 - Giải tích số (3 TC): Bạn được 10.0 Giải tích 3 và 8.5 PTVP nên học môn này nắm chắc điểm A+.\n"
            "  - MAT3538 - Các hệ thống tri thức (3 TC): Nối tiếp trực tiếp môn Trí tuệ nhân tạo Kỳ 5.\n\n"
            "3. NHÓM BẮT BUỘC CÒN LẠI (Bắt buộc phải học đủ 100%):\n"
            "• Đang học ở Kỳ 5 (5 môn bắt buộc - 14 TC): THL1057 (1/5 sao ★☆☆☆☆), MAT1206E (3/5 sao ★★★☆☆), MAT3505 (3/5 sao ★★★☆☆), MAT3506 (3/5 sao ★★★☆☆), MAT3533 (4/5 sao ★★★★☆).\n"
            "• Còn 7 môn bắt buộc cho Kỳ 6 - Kỳ 7 (21 TC): MAT1204 - PP NCKH (2/5 sao ★★☆☆☆), MAT3374 - Thực tập PTPM (3/5 sao ★★★☆☆), MAT1207 - Công nghệ phần mềm (3/5 sao ★★★☆☆), MAT2407 - Tối ưu hóa (4/5 sao ★★★★☆ - Lưu ý: nên học thầy Phan, không nên học thầy Dũng), MAT3552E - Thiết kế & Đánh giá thuật toán DAA (4/5 sao ★★★★☆), MAT3373E - An toàn máy tính (3.5/5 sao ★★★☆☆), MAT3375 - Hệ thống nhúng (4/5 sao ★★★★☆)."
        )

    # PRIORITY 5: Semester 5 current schedule & next semester (Kỳ 6) recommendations
    if any(k in msg_lower for k in ["kỳ 5", "kì 5", "thời khóa biểu", "đang học", "kỳ 6", "kì 6", "đăng ký", "lộ trình"]):
        sem5_lines = []
        for idx, c in enumerate(in_progress_courses, 1):
            note_part = f" | Ghi chú: {c['note']}" if c.get("note") else ""
            sched_part = f" | Lịch: {c['schedule_info']}" if c.get("schedule_info") else ""
            sem5_lines.append(f"{idx}. {c['code']} - {c['name_vi']} ({c['credits']} TC, {c['sub_block']}){sched_part}{note_part}")

        return (
            f"PHÂN TÍCH KỲ 5 HIỆN TẠI ({in_prog_tc} TC + NCKH NLP) & ĐỀ XUẤT KỲ 6 CỦA PHẠM NGỌC HUÂN\n\n"
            f"1. Trạng thái tích lũy tính đến hiện tại:\n"
            f"• Đã hoàn thành (Kỳ 1 -> Kỳ 4): 23 môn ({total_tc}/129 TC - 55.04%) | CPA hệ 4: {cpa4:.2f}/4.0 (Hạng Giỏi) | CPA hệ 10: {cpa10:.2f}/10.0.\n"
            f"• Đang theo học tại Kỳ 5: {len(in_progress_courses)} môn ({in_prog_tc} tín chỉ) + Đang thực hiện Nghiên cứu khoa học về NLP.\n\n"
            f"2. Chi tiết 6 học phần trong Thời khóa biểu Kỳ 5 ({in_prog_tc} TC):\n"
            + ("\n".join(sem5_lines) if sem5_lines else "Chưa có môn đang học.")
            + "\n\n"
            f"3. Các môn ưu tiên số 1 cần đăng ký ở Kỳ 6 tới:\n"
            f"• MAT3561E - Xử lí ngôn ngữ tự nhiên (3 TC - Tự chọn V.2.2): Khớp 100% với đề tài NCKH NLP bạn đang làm!\n"
            f"• MAT1204 - Phương pháp nghiên cứu khoa học (3 TC - Bắt buộc Khối IV, 2/5 sao): Dùng ngay bài báo NCKH NLP để lấy A+.\n"
            f"• MAT2407 - Tối ưu hóa (3 TC - Bắt buộc Khối IV, 4/5 sao): Lưu ý đăng ký lớp thầy Phan (tránh lớp thầy Dũng).\n"
            f"• MAT3374 - Thực tập thực tế phát triển phần mềm (3 TC - Bắt buộc V.1, 3/5 sao): Để mở khóa Công nghệ phần mềm ở Kỳ 7.\n"
            f"• MAT3552E - Thiết kế và đánh giá thuật toán (DAA - 3 TC - Bắt buộc V.1, 4/5 sao).\n"
            f"• MAT3534 - Khai phá dữ liệu (3 TC) hoặc MAT3535 - Tìm kiếm thông tin (3 TC - 2/5 sao, nền tảng cho RAG/NLP)."
        )

    # PRIORITY 6: Retake D/D+ & CPA Strategy
    if any(k in msg_lower for k in ["cải thiện", "3.60", "xuất sắc", "chiến lược", "học lại"]):
        return (
            f"CHIẾN LƯỢC HỌC CẢI THIỆN MÔN D+ (ĐÚNG QUY CHẾ ĐHQGHN) & TỐI ƯU CPA\n\n"
            f"1. Quy chế Học cải thiện của ĐHQGHN:\n"
            f"• Sinh viên CHỈ được phép đăng ký học cải thiện đối với các học phần đạt điểm D hoặc D+.\n"
            f"• Trong 23 môn bạn đã tích lũy (71 TC), chỉ có duy nhất 1 môn điểm D+ được phép cải thiện là:\n"
            f"  -> MAT1202 - Lập trình hướng đối tượng (3 tín chỉ | Điểm hiện tại: 5.4 - D+ | Hệ 4: 1.5).\n\n"
            f"2. Hiệu quả tức thì khi cải thiện MAT1202 (OOP - 3 TC):\n"
            f"• Nếu cải thiện OOP từ D+ (1.5) lên A (3.7): CPA 71 tín chỉ đầu nhảy vọt từ 3.26 lên 3.35!\n"
            f"• Nếu cải thiện OOP từ D+ (1.5) lên A+ (4.0): CPA 71 tín chỉ đầu tăng lên 3.37."
        )

    # Default concise response answering directly
    return (
        f"Chào Huân! Hiện tại bạn đã tích lũy {total_tc}/129 TC (CPA {cpa4:.2f}/4.0 - Giỏi), đang học 6 môn Kỳ 5 ({in_prog_tc} TC) và đang làm Nghiên cứu khoa học về NLP.\n\n"
        f"Bạn muốn hỏi chi tiết về môn học nào (ví dụ: 'Môn DAA MAT3552E học gì khó không?', 'Môn Tối ưu hóa nên học thầy nào?', 'Gợi ý lộ trình NCKH NLP')? Hãy gõ tên môn hoặc câu hỏi cụ thể nhé!"
    )


def build_system_prompt(db: Dict[str, Any], progress: Dict[str, Any]) -> str:
    courses_state = progress.get("courses_state", {})
    completed_lines = []
    in_progress_lines = []
    uncompleted_lines = []

    for c in db["courses"]:
        st = courses_state.get(c["code"], {})
        is_comp = st.get("completed", c["completed"])
        is_in_prog = st.get("in_progress", False) and not is_comp
        note_str = f" | Ghi chú: {st.get('note')}" if st.get("note") else ""
        teacher_str = f" | Lưu ý Giảng viên: {st.get('teacher_note')}" if st.get("teacher_note") else ""
        syl = COURSE_SYLLABUS_KNOWLEDGE.get(c["code"], {})
        diff_str = f" | Độ khó: {syl.get('difficulty', '3/5 sao')}"

        if is_comp and c["counts_gpa"]:
            completed_lines.append(
                f"- {c['code']}: {c['name_vi']} ({c['credits']} TC, Kỳ {st.get('semester', c['semester'])}) | Điểm 10: {st.get('score10', c['score10'])} | Điểm chữ: {st.get('letter', c['letter'])} | Hệ 4: {st.get('score4', c['score4'])}{note_str}{teacher_str}"
            )
        elif is_in_prog and c["counts_gpa"]:
            in_progress_lines.append(
                f"- {c['code']}: {c['name_vi']} ({c['credits']} TC, Đang học Kỳ 5, Lịch: {st.get('schedule_info', '')}){diff_str}{note_str}{teacher_str}"
            )
        elif c["counts_gpa"]:
            prereq_str = ", ".join(c["prerequisites"]) if c["prerequisites"] else "Không"
            uncompleted_lines.append(
                f"- {c['code']}: {c['name_vi']} ({c['name_en']}, {c['credits']} TC, Khối {c['sub_block']}, {c['type']}, Tiên quyết: {prereq_str}, Dự kiến Kỳ {st.get('planned_semester', c['recommended_semester'])}){diff_str}{note_str}{teacher_str}"
            )

    custom_mems = [
        f"- [{m.get('course_code') or 'CHUNG'}] {m.get('topic')}: {m.get('content')} ({m.get('created_at')})"
        for m in progress.get("custom_memories", [])
    ]

    nlp_info = progress.get("nlp_research", {})

    return f"""Bạn là Cố vấn Học tập AI cá nhân (AI Academic Advisor) dành riêng cho sinh viên Phạm Ngọc Huân, ngành Khoa học máy tính và thông tin (7480113QTD) - Trường Đại học Khoa học Tự nhiên, ĐHQGHN (HUS) theo Quyết định 3568/QĐ-ĐHKHTN.

QUY TẮC TRẢ LỜI BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG sử dụng ký hiệu dấu sao kép ** hoặc dấu ` trong câu trả lời. Hãy trình bày văn bản sạch sẽ, dùng gạch đầu dòng (• hoặc -) và đánh số (1., 2., 3.) rõ ràng.
2. Trả lời THẲNG VÀO TRỌNG TÂM câu hỏi của Huân (ví dụ: hỏi "môn DAA có khó không" thì hiểu ngay DAA là MAT3552E - Thiết kế và đánh giá thuật toán - Design and Analysis of Algorithms, đánh giá độ khó 4/5 sao, nội dung học và cách ôn tập; hỏi "môn Tối ưu hóa nên học thầy nào" thì trả lời ngay theo ghi chú đã lưu: nên học thầy Phan, không nên học thầy Dũng).
3. KHÔNG BAO GIỜ tự ý lặp lại bản tóm tắt hồ sơ chung chung nếu người dùng đang hỏi về một môn học cụ thể.
4. Theo quy chế ĐHQGHN, sinh viên CHỈ được phép học cải thiện các môn đạt điểm D hoặc D+ (chỉ có duy nhất môn MAT1202 - Lập trình hướng đối tượng 3 TC đang đạt D+ 5.4 là được phép học cải thiện).

THÔNG TIN HỌC KỲ 5 HIỆN TẠI & NGHIÊN CỨU KHOA HỌC NLP CỦA HUÂN:
- Đã tích lũy xong (Kỳ 1 -> Kỳ 4): 71/129 TC (23 môn học). CPA hệ 4: 3.26 | CPA hệ 10: 7.95 | Xếp loại: Giỏi.
- Đang học ở Kỳ 5 hiện tại (16 TC - 6 môn):
{chr(10).join(in_progress_lines)}
- Nghiên cứu khoa học (NCKH) đang thực hiện ở Kỳ 5: Đề tài về Xử lý ngôn ngữ tự nhiên (NLP): {nlp_info.get('topic_title', 'Nghiên cứu NLP & LLM')}. Mục tiêu: {nlp_info.get('research_goal', '')}.

GHI CHÚ GIẢNG VIÊN & KINH NGHIỆM HỌC TẬP ĐÃ LƯU TRONG BỘ NHỚ CỦA HUÂN (ƯU TIÊN ÁP DỤNG KHI TƯ VẤN):
{chr(10).join(custom_mems) if custom_mems else "Chưa có ghi chú thêm"}

DANH SÁCH 23 MÔN ĐÃ CÓ ĐIỂM (KỲ 1 -> KỲ 4):
{chr(10).join(completed_lines)}

DANH SÁCH CÁC MÔN CÒN LẠI CHƯA HỌC (KÈM ĐỘ KHÓ 0-5 SAO):
{chr(10).join(uncompleted_lines)}
"""


@app.post("/api/ai-advisor")
async def chat_ai_advisor(req: AIAdvisorRequest):
    db = load_db()
    progress = load_progress()
    if req.custom_context and "courses_state" in req.custom_context:
        progress["courses_state"] = req.custom_context["courses_state"]

    # 1. Check if the user is making a DECLARATIVE teaching statement (NEVER triggers on questions!)
    learned_mem = try_auto_learn_from_message(req.message, db, progress)
    if learned_mem:
        # Reindex RAG in memory so the new fact is immediately searchable
        rag_engine._load_or_build_index()
        reply_clean = (
            f"Đã ghi nhớ và cập nhật vào Hệ thống RAG Embeddings của bạn!\n\n"
            f"• Chủ đề: {learned_mem['topic']}\n"
            f"• Nội dung đã nạp: \"{learned_mem['content']}\"\n"
            f"• Thời gian lưu: {learned_mem['created_at']}\n\n"
            f"Từ bây giờ, hệ thống RAG sẽ truy xuất thông tin này để tư vấn chính xác cho Huân."
        )
        return {
            "reply": reply_clean,
            "mode": "rag_memory_learned",
            "model_used": "HUS-CIS-RAG-Memory",
            "memory_added": learned_mem,
            "rag_sources": [f"Ghi nhớ người dùng: {learned_mem['topic']}"],
            "user_progress": progress
        }

    model = (req.model or os.getenv("AI_MODEL") or "gemini-3.5-flash-lite").strip()
    gemini_key = (req.gemini_api_key or os.getenv("GEMINI_API_KEY") or "").strip()
    openai_key = (req.api_key or os.getenv("AI_API_KEY") or "").strip()
    base_url = (req.base_url or os.getenv("AI_BASE_URL") or "https://agentrouter.org/v1").strip()

    if openai_key.startswith(("AQ.", "AIza")) and not gemini_key:
        gemini_key = openai_key

    # 2. REAL RAG RETRIEVAL (Vector Cosine Similarity with Gemini 3072-dim Embeddings + BM25 Lexical)
    rag_results = rag_engine.retrieve(req.message, top_k=4)
    rag_sources = [c.title for c, _ in rag_results]
    evidence_blocks = []
    for i, (c, score) in enumerate(rag_results):
        evidence_blocks.append(f"--- NGUỒN RAG [{i+1}] ({c.category.upper()} - Độ khớp {score:.2f}): {c.title} ---\n{c.content}")
    rag_evidence_text = "\n\n".join(evidence_blocks)

    system_prompt = f"""Bạn là Cố vấn Học tập AI cá nhân (AI Academic Advisor) dành riêng cho sinh viên Phạm Ngọc Huân, ngành Khoa học máy tính và thông tin (7480113QTD) - Trường Đại học Khoa học Tự nhiên, ĐHQGHN (HUS) theo Quyết định 3568/QĐ-ĐHKHTN.

QUY TẮC PHẢN HỒI BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG sử dụng ký hiệu dấu sao kép ** hoặc dấu gạch huyền ` trong câu trả lời (người dùng đặc biệt không thích ký tự này). Trình bày văn bản sạch sẽ, tự nhiên, gạch đầu dòng rõ ràng.
2. Trả lời THẲNG VÀO TRỌNG TÂM câu hỏi của Huân với giọng điệu thân thiện, súc tích, thông minh như một người anh/thầy cố vấn học tập dày dạn kinh nghiệm tại HUS. Không in lại cả bản tóm tắt hồ sơ nếu câu hỏi chỉ hỏi về một môn học cụ thể.
3. DỰA CHẶT CHẼ VÀO NGUỒN DỮ LIỆU RAG DƯỚI ĐÂY ĐỂ ĐƯA RA CÂU TRẢ LỜI CHÍNH XÁC:
- Nếu hỏi về môn học: Nêu rõ mã môn, số tín chỉ, độ khó (số sao), nội dung học, lời khuyên ôn tập, môn tiên quyết.
- Nếu hỏi về giảng viên: Bắt buộc nêu rõ các lưu ý đã lưu (ví dụ: Tối ưu hóa MAT2407 nên học thầy Phan, không nên học thầy Dũng; Học máy MAT3533 nên học thầy Hà Quang Thụy).
- Nếu hỏi về điểm số / số môn A: Báo cáo chính xác danh sách các môn A/A+ và phân phối điểm của Huân.
- Nếu hỏi về NCKH NLP: Liên hệ mật thiết với đề tài NLP Kỳ 5 Huân đang làm, gắn kết với môn Học máy, Trí tuệ nhân tạo và mở đường cho môn NLP MAT3561E + Khóa luận tốt nghiệp MAT4080 (7 TC).
- Quy chế học cải thiện: Chỉ môn D/D+ (MAT1202 OOP) mới được học cải thiện.

NGUỒN DỮ LIỆU RAG TRÍCH XUẤT CHO CÂU HỎI HIỆN TẠI:
{rag_evidence_text}
"""

    # 3. Call Google Gemini API (gemini-3.5-flash-lite / gemini-3.8-flash / gemini-4-argon)
    if gemini_key and (model.startswith("gemini") or openai_key.startswith(("AQ.", "AIza"))):
        # We prefer gemini-3.5-flash-lite for instant speed and high availability, or requested gemini model
        candidate_models = [model]
        if model != "gemini-3.5-flash-lite":
            candidate_models.append("gemini-3.5-flash-lite")
        if "gemini-4-argon" not in candidate_models:
            candidate_models.append("gemini-4-argon")

        for gem_m in candidate_models:
            try:
                def _call_gemini():
                    from google import genai
                    client = genai.Client(api_key=gemini_key)
                    history_context = []
                    for h in (req.history or [])[-4:]:
                        if h.get("role") in ("user", "assistant") and h.get("content"):
                            role_name = "Huân" if h["role"] == "user" else "Cố vấn AI"
                            history_context.append(f"{role_name}: {h['content']}")
                    history_str = "\n".join(history_context)
                    full_prompt = (
                        f"{system_prompt}\n\n"
                        f"LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n{history_str}\n\n"
                        f"CÂU HỎI MỚI CỦA PHẠM NGỌC HUÂN: {req.message}"
                    )
                    resp = client.models.generate_content(
                        model=gem_m,
                        contents=full_prompt
                    )
                    return resp.text if resp else None

                reply_text = await asyncio.wait_for(asyncio.to_thread(_call_gemini), timeout=12.0)
                if reply_text:
                    return {
                        "reply": strip_markdown_stars(reply_text),
                        "mode": "rag_neural_gemini",
                        "model_used": gem_m,
                        "rag_sources": rag_sources
                    }
            except Exception as e:
                print(f"[Gemini Call Notice on {gem_m}]: {e}")
                continue

    # 4. Call AgentRouter if requested
    if openai_key and not model.startswith("gemini"):
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=openai_key,
                base_url=base_url,
                timeout=8.0,
                default_headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            )
            messages = [{"role": "system", "content": system_prompt}]
            for h in (req.history or [])[-4:]:
                if h.get("role") in ("user", "assistant") and h.get("content"):
                    messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": req.message})

            completion = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.35,
                    max_tokens=1600
                ),
                timeout=8.0
            )
            reply = completion.choices[0].message.content
            if reply:
                return {
                    "reply": strip_markdown_stars(reply),
                    "mode": "rag_neural_agentrouter",
                    "model_used": model,
                    "rag_sources": rag_sources
                }
        except Exception:
            pass

    # 5. High-fidelity RAG Synthesizer fallback if network/API is offline
    fallback_reply = generate_smart_expert_response(req.message, db, progress, req.history)
    return {
        "reply": strip_markdown_stars(fallback_reply),
        "mode": "rag_hybrid_fallback",
        "model_used": model,
        "rag_sources": rag_sources
    }
