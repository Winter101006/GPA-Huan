import json
import os
import openpyxl

def score10_to_grade(score10):
    if score10 is None:
        return None, None
    s = round(float(score10), 1)
    if s >= 9.0:
        return "A+", 4.0
    elif s >= 8.5:
        return "A", 3.7
    elif s >= 8.0:
        return "B+", 3.5
    elif s >= 7.0:
        return "B", 3.0
    elif s >= 6.5:
        return "C+", 2.5
    elif s >= 5.5:
        return "C", 2.0
    elif s >= 5.0:
        return "D+", 1.5
    elif s >= 4.0:
        return "D", 1.0
    else:
        return "F", 0.0

EXCEL_NAME_TO_CODE = {
    "tiếng anh b1": "FLF1107",
    "linux": "MAT3557",
    "môi trường lập trình linux": "MAT3557",
    "triết": "PHI1006",
    "triết học mác - lênin": "PHI1006",
    "giải tích 1": "MAT2501",
    "lập trình cơ bản": "MAT2505",
    "tin học cơ sở": "HUS1011",
    "lịch sử đảng": "HIS1001",
    "lịch sử đảng cộng sản việt nam": "HIS1001",
    "đại số tuyến tính": "MAT2400",
    "kinh tế chính trị mac-lenin": "PEC1008",
    "kinh tế chính trị mác - lênin": "PEC1008",
    "giải tích 2": "MAT2502",
    "phân tích dữ liệu": "HUS1023",
    "nhập môn phân tích dữ liệu": "HUS1023",
    "lập trình hướng đối tượng": "MAT1202",
    "toán rời rạc": "MAT3500",
    "cấu trúc dữ liệu và thuật toán": "MAT3514",
    "giải tích 3": "MAT2503",
    "khoa học trái đất và sự sống": "HUS1021",
    "tiếng anh chuyên ngành": "MAT1205E",
    "tiếng anh chuyên ngành khoa học máy tính": "MAT1205E",
    "xác suất thống kê": "MAT2323",
    "xác suất - thống kê": "MAT2323",
    "phương trình vi phân": "MAT2403",
    "nguyên lý hệ điều hành": "MAT3550E",
    "nguyên lí hệ điều hành": "MAT3550E",
    "cơ sở dữ liệu": "MAT3507",
    "tư tưởng hồ chí minh": "POL1001",
    "chủ nghĩa xã hội khoa học": "PHI1002",
}

def get_base_curriculum():
    courses = [
        # KHỐI I - KIẾN THỨC CHUNG (21 TC GPA + 15 TC điều kiện)
        {
            "code": "PHI1006",
            "name_vi": "Triết học Mác - Lênin",
            "name_en": "Marxist-Leninist Philosophy",
            "credits": 3,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 1,
            "plo": ["PK1", "PS4"]
        },
        {
            "code": "PEC1008",
            "name_vi": "Kinh tế chính trị Mác - Lênin",
            "name_en": "Marxist-Leninist Political Economy",
            "credits": 2,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["PHI1006"],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 2,
            "plo": ["PK1", "PS4"]
        },
        {
            "code": "PHI1002",
            "name_vi": "Chủ nghĩa xã hội khoa học",
            "name_en": "Scientific Socialism",
            "credits": 2,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["PHI1006"],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 4,
            "plo": ["PK1", "PS4"]
        },
        {
            "code": "HIS1001",
            "name_vi": "Lịch sử Đảng Cộng sản Việt Nam",
            "name_en": "History of the Communist Party of Vietnam",
            "credits": 2,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 2,
            "plo": ["PK1", "PS4"]
        },
        {
            "code": "POL1001",
            "name_vi": "Tư tưởng Hồ Chí Minh",
            "name_en": "Ho Chi Minh Ideology",
            "credits": 2,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 4,
            "plo": ["PK1", "PS4"]
        },
        {
            "code": "THL1057",
            "name_vi": "Nhà nước và pháp luật đại cương",
            "name_en": "Introduction to State and Law",
            "credits": 2,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK1", "PS6"]
        },
        {
            "code": "HUS1011",
            "name_vi": "Tin học cơ sở",
            "name_en": "Introduction to Informatics",
            "credits": 3,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 1,
            "plo": ["PK2", "PS1"]
        },
        {
            "code": "FLF1107",
            "name_vi": "Tiếng Anh B1",
            "name_en": "English B1",
            "credits": 5,
            "block": "I",
            "sub_block": "I.1",
            "block_name": "Khối I - Kiến thức chung",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 50, "practice": 25, "self_study": 175},
            "language": "Tiếng Anh",
            "recommended_semester": 1,
            "plo": ["PS5"]
        },
        # Học phần điều kiện (Không tính GPA)
        {
            "code": "CME1000",
            "name_vi": "Giáo dục quốc phòng và an ninh",
            "name_en": "National Defense and Security Education",
            "credits": 8,
            "block": "I",
            "sub_block": "I.2",
            "block_name": "Khối I - Học phần điều kiện (Không tính GPA)",
            "type": "Điều kiện",
            "counts_gpa": False,
            "prerequisites": [],
            "hours": {"theory": 90, "practice": 75, "self_study": 235},
            "language": "Tiếng Việt",
            "recommended_semester": 1,
            "plo": ["PS6"]
        },
        {
            "code": "PES1000",
            "name_vi": "Giáo dục thể chất",
            "name_en": "Physical Education",
            "credits": 4,
            "block": "I",
            "sub_block": "I.2",
            "block_name": "Khối I - Học phần điều kiện (Không tính GPA)",
            "type": "Điều kiện",
            "counts_gpa": False,
            "prerequisites": [],
            "hours": {"theory": 10, "practice": 110, "self_study": 80},
            "language": "Tiếng Việt",
            "recommended_semester": 2,
            "plo": ["PS6"]
        },
        {
            "code": "HUS1012",
            "name_vi": "Kỹ năng bổ trợ",
            "name_en": "Soft Skills",
            "credits": 3,
            "block": "I",
            "sub_block": "I.2",
            "block_name": "Khối I - Học phần điều kiện (Không tính GPA)",
            "type": "Điều kiện",
            "counts_gpa": False,
            "prerequisites": [],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PS4", "PS5"]
        },

        # KHỐI II - KIẾN THỨC THEO LĨNH VỰC (Chọn 5/13 TC)
        {
            "code": "HUS1021",
            "name_vi": "Khoa học Trái Đất và sự sống",
            "name_en": "Earth and Life Sciences",
            "credits": 3,
            "block": "II",
            "sub_block": "II.1",
            "block_name": "Khối II - Kiến thức theo lĩnh vực (Tự chọn 5/13 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PK1"]
        },
        {
            "code": "HUS1023",
            "name_vi": "Nhập môn phân tích dữ liệu",
            "name_en": "Introduction to Data Analysis",
            "credits": 2,
            "block": "II",
            "sub_block": "II.1",
            "block_name": "Khối II - Kiến thức theo lĩnh vực (Tự chọn 5/13 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 2,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "HUS1022",
            "name_vi": "Nhập môn Internet kết nối vạn vật (IoT)",
            "name_en": "Introduction to Internet of Things",
            "credits": 2,
            "block": "II",
            "sub_block": "II.1",
            "block_name": "Khối II - Kiến thức theo lĩnh vực (Tự chọn 5/13 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PK2", "PS3"]
        },
        {
            "code": "HUS1024",
            "name_vi": "Nhập môn Robotic",
            "name_en": "Introduction to Robotics",
            "credits": 3,
            "block": "II",
            "sub_block": "II.1",
            "block_name": "Khối II - Kiến thức theo lĩnh vực (Tự chọn 5/13 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PK2", "PS3"]
        },
        {
            "code": "HIS1056",
            "name_vi": "Cơ sở văn hóa Việt Nam",
            "name_en": "Fundamentals of Vietnamese Culture",
            "credits": 3,
            "block": "II",
            "sub_block": "II.1",
            "block_name": "Khối II - Kiến thức theo lĩnh vực (Tự chọn 5/13 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PK1", "PS4"]
        },

        # KHỐI III - KIẾN THỨC THEO KHỐI NGÀNH (3 TC)
        {
            "code": "MAT2505",
            "name_vi": "Lập trình cơ bản",
            "name_en": "Fundamental Programming",
            "credits": 3,
            "block": "III",
            "sub_block": "III.1",
            "block_name": "Khối III - Kiến thức theo khối ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["HUS1011"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 1,
            "plo": ["PK3", "PS1"]
        },

        # KHỐI IV - KIẾN THỨC THEO NHÓM NGÀNH (28 TC)
        {
            "code": "MAT2400",
            "name_vi": "Đại số tuyến tính",
            "name_en": "Linear Algebra",
            "credits": 5,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 45, "practice": 30, "self_study": 175},
            "language": "Tiếng Việt",
            "recommended_semester": 2,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT2501",
            "name_vi": "Giải tích 1",
            "name_en": "Calculus 1",
            "credits": 4,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 45, "practice": 15, "self_study": 140},
            "language": "Tiếng Việt",
            "recommended_semester": 1,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT2502",
            "name_vi": "Giải tích 2",
            "name_en": "Calculus 2",
            "credits": 4,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2501"],
            "hours": {"theory": 45, "practice": 15, "self_study": 140},
            "language": "Tiếng Việt",
            "recommended_semester": 2,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT2503",
            "name_vi": "Giải tích 3",
            "name_en": "Calculus 3",
            "credits": 2,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2502"],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT2403",
            "name_vi": "Phương trình vi phân",
            "name_en": "Differential Equations",
            "credits": 3,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2400", "MAT2501"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 4,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT2323",
            "name_vi": "Xác suất - Thống kê",
            "name_en": "Probability and Statistics",
            "credits": 4,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2502"],
            "hours": {"theory": 45, "practice": 15, "self_study": 140},
            "language": "Tiếng Việt",
            "recommended_semester": 4,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT2407",
            "name_vi": "Tối ưu hóa",
            "name_en": "Optimization",
            "credits": 3,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2400", "MAT2502"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT1204",
            "name_vi": "Phương pháp nghiên cứu khoa học",
            "name_en": "Scientific Research Methodology",
            "credits": 3,
            "block": "IV",
            "sub_block": "IV.1",
            "block_name": "Khối IV - Kiến thức theo nhóm ngành",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT3507", "MAT3514"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK6", "PS4", "PS5"]
        },

        # KHỐI V - KIẾN THỨC NGÀNH (72 TC: V.1 Bắt buộc 49 TC + V.2 Tự chọn 16 TC + V.3 Tốt nghiệp 7 TC)
        # V.1 Bắt buộc (49 TC)
        {
            "code": "MAT1205E",
            "name_vi": "Tiếng Anh chuyên ngành khoa học máy tính",
            "name_en": "English for Computer Science",
            "credits": 2,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["FLF1107"],
            "hours": {"theory": 20, "practice": 10, "self_study": 70},
            "language": "Tiếng Anh",
            "recommended_semester": 3,
            "plo": ["PS5"]
        },
        {
            "code": "MAT3500",
            "name_vi": "Toán rời rạc",
            "name_en": "Discrete Mathematics",
            "credits": 4,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 45, "practice": 15, "self_study": 140},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PK2", "PK3", "PS2"]
        },
        {
            "code": "MAT3557",
            "name_vi": "Môi trường lập trình Linux",
            "name_en": "Linux Programming Environment",
            "credits": 2,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": [],
            "hours": {"theory": 15, "practice": 15, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 1,
            "plo": ["PK4", "PS1"]
        },
        {
            "code": "MAT3550E",
            "name_vi": "Nguyên lí hệ điều hành",
            "name_en": "Principles of Operating Systems",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 4,
            "plo": ["PK4", "PS1", "PS5"]
        },
        {
            "code": "MAT3507",
            "name_vi": "Cơ sở dữ liệu",
            "name_en": "Database Systems",
            "credits": 4,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 45, "practice": 15, "self_study": 140},
            "language": "Tiếng Việt",
            "recommended_semester": 4,
            "plo": ["PK3", "PK5", "PS1"]
        },
        {
            "code": "MAT1202",
            "name_vi": "Lập trình hướng đối tượng",
            "name_en": "Object-Oriented Programming",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 2,
            "plo": ["PK3", "PK5", "PS1"]
        },
        {
            "code": "MAT3514",
            "name_vi": "Cấu trúc dữ liệu và thuật toán",
            "name_en": "Data Structures and Algorithms",
            "credits": 4,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 45, "practice": 15, "self_study": 140},
            "language": "Tiếng Việt",
            "recommended_semester": 3,
            "plo": ["PK3", "PS1", "PS2"]
        },
        {
            "code": "MAT3552E",
            "name_vi": "Thiết kế và đánh giá thuật toán",
            "name_en": "Algorithm Design and Analysis",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT3514"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 5,
            "plo": ["PK3", "PS2", "PS5"]
        },
        {
            "code": "MAT3505",
            "name_vi": "Kiến trúc máy tính",
            "name_en": "Computer Architecture",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2505", "MAT3557"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK4", "PS1"]
        },
        {
            "code": "MAT3373E",
            "name_vi": "Nhập môn an toàn máy tính",
            "name_en": "Introduction to Computer Security",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 6,
            "plo": ["PK4", "PS3", "PS5"]
        },
        {
            "code": "MAT3506",
            "name_vi": "Mạng máy tính",
            "name_en": "Computer Networks",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK4", "PS1"]
        },
        {
            "code": "MAT1206E",
            "name_vi": "Nhập môn Trí tuệ nhân tạo",
            "name_en": "Introduction to Artificial Intelligence",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT3507", "MAT1202"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 5,
            "plo": ["PK6", "PS2", "PS5"]
        },
        {
            "code": "MAT3374",
            "name_vi": "Thực tập thực tế phát triển phần mềm",
            "name_en": "Software Development Practicum",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT1202", "MAT3507"],
            "hours": {"theory": 15, "practice": 30, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK5", "PS3", "PS4"]
        },
        {
            "code": "MAT1207",
            "name_vi": "Công nghệ phần mềm",
            "name_en": "Software Engineering",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT3374"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK5", "PS3", "PS4"]
        },
        {
            "code": "MAT3541E",
            "name_vi": "Nguyên lí các ngôn ngữ lập trình",
            "name_en": "Principles of Programming Languages",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT1202"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 6,
            "plo": ["PK3", "PS1", "PS5"]
        },
        {
            "code": "MAT3533",
            "name_vi": "Học máy",
            "name_en": "Machine Learning",
            "credits": 3,
            "block": "V",
            "sub_block": "V.1",
            "block_name": "Khối V.1 - Kiến thức ngành Bắt buộc (49 TC)",
            "type": "Bắt buộc",
            "counts_gpa": True,
            "prerequisites": ["MAT2323"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK6", "PS2", "PS3"]
        },

        # V.2.1 Tự chọn kỹ năng phần mềm (Chọn 4/8 TC)
        {
            "code": "MAT3519",
            "name_vi": "Ngôn ngữ lập trình thứ hai",
            "name_en": "Second Programming Language (Python/Java/C#)",
            "credits": 2,
            "block": "V",
            "sub_block": "V.2.1",
            "block_name": "Khối V.2.1 - Tự chọn Kỹ năng phần mềm (Chọn 4/8 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 15, "practice": 15, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK3", "PK5", "PS1"]
        },
        {
            "code": "MAT3558",
            "name_vi": "Lập trình mobile",
            "name_en": "Mobile Application Development",
            "credits": 2,
            "block": "V",
            "sub_block": "V.2.1",
            "block_name": "Khối V.2.1 - Tự chọn Kỹ năng phần mềm (Chọn 4/8 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 15, "practice": 15, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK5", "PS3"]
        },
        {
            "code": "MAT1208",
            "name_vi": "Xây dựng hệ thống nhúng",
            "name_en": "Embedded Systems Design",
            "credits": 2,
            "block": "V",
            "sub_block": "V.2.1",
            "block_name": "Khối V.2.1 - Tự chọn Kỹ năng phần mềm (Chọn 4/8 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT1202", "MAT3505"],
            "hours": {"theory": 15, "practice": 15, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK4", "PS3"]
        },
        {
            "code": "MAT3560",
            "name_vi": "Phát triển phần mềm trò chơi",
            "name_en": "Game Software Development",
            "credits": 2,
            "block": "V",
            "sub_block": "V.2.1",
            "block_name": "Khối V.2.1 - Tự chọn Kỹ năng phần mềm (Chọn 4/8 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2505"],
            "hours": {"theory": 15, "practice": 15, "self_study": 70},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK5", "PS3"]
        },

        # V.2.2 Tự chọn Trí tuệ nhân tạo và Phát triển phần mềm (Chọn 12/39 TC)
        {
            "code": "MAT3148",
            "name_vi": "Tính toán song song",
            "name_en": "Parallel Computing",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT3514"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK4", "PS2"]
        },
        {
            "code": "MAT3554E",
            "name_vi": "Ngôn ngữ hình thức và ôtômat",
            "name_en": "Formal Languages and Automata",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2505", "MAT3500"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 6,
            "plo": ["PK2", "PK3", "PS5"]
        },
        {
            "code": "MAT3562E",
            "name_vi": "Thị giác máy tính",
            "name_en": "Computer Vision",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT3533", "MAT2400"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 6,
            "plo": ["PK6", "PS2", "PS3", "PS5"]
        },
        {
            "code": "MAT3561E",
            "name_vi": "Xử lí ngôn ngữ tự nhiên và ứng dụng",
            "name_en": "Natural Language Processing and Applications",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT3533"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Anh",
            "recommended_semester": 6,
            "plo": ["PK6", "PS2", "PS3", "PS5"]
        },
        {
            "code": "MAT3563",
            "name_vi": "Một số vấn đề chọn lọc về thị giác máy tính",
            "name_en": "Selected Topics in Computer Vision",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT3562E"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 7,
            "plo": ["PK6", "PS2", "PS3"]
        },
        {
            "code": "MAT3534",
            "name_vi": "Khai phá dữ liệu",
            "name_en": "Data Mining",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT3507", "MAT2323"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK6", "PS2", "PS3"]
        },
        {
            "code": "MAT3542",
            "name_vi": "Phát triển ứng dụng web",
            "name_en": "Web Application Development",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT1202", "MAT3507"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK5", "PS3"]
        },
        {
            "code": "MAT3539",
            "name_vi": "Mật mã và an toàn dữ liệu",
            "name_en": "Cryptography and Data Security",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2400", "MAT2505"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK2", "PK4", "PS2"]
        },
        {
            "code": "MAT3452",
            "name_vi": "Phân tích thống kê nhiều chiều",
            "name_en": "Multivariate Statistical Analysis",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2323"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK2", "PK6", "PS2"]
        },
        {
            "code": "MAT3453",
            "name_vi": "Phương pháp chọn mẫu dữ liệu",
            "name_en": "Data Sampling Methods",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2323"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK2", "PK6", "PS2"]
        },
        {
            "code": "MAT2034",
            "name_vi": "Giải tích số",
            "name_en": "Numerical Analysis",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT2502", "MAT2403"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 5,
            "plo": ["PK2", "PS2"]
        },
        {
            "code": "MAT3538",
            "name_vi": "Các hệ thống tri thức",
            "name_en": "Knowledge Systems",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT1206E", "MAT3514"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 7,
            "plo": ["PK6", "PS2"]
        },
        {
            "code": "MAT3535",
            "name_vi": "Tìm kiếm thông tin",
            "name_en": "Information Retrieval",
            "credits": 3,
            "block": "V",
            "sub_block": "V.2.2",
            "block_name": "Khối V.2.2 - Tự chọn AI & Phát triển phần mềm (Chọn 12/39 TC)",
            "type": "Tự chọn",
            "counts_gpa": True,
            "prerequisites": ["MAT3514", "MAT2323"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 6,
            "plo": ["PK6", "PS2"]
        },

        # V.3 Khóa luận tốt nghiệp hoặc Học phần thay thế (7 TC)
        {
            "code": "MAT4080",
            "name_vi": "Khóa luận tốt nghiệp",
            "name_en": "Graduation Thesis",
            "credits": 7,
            "block": "V",
            "sub_block": "V.3",
            "block_name": "Khối V.3 - Tốt nghiệp (7 TC)",
            "type": "Tốt nghiệp",
            "counts_gpa": True,
            "prerequisites": ["MAT1204"],
            "hours": {"theory": 0, "practice": 105, "self_study": 245},
            "language": "Tiếng Việt / Tiếng Anh",
            "recommended_semester": 8,
            "plo": ["PK6", "PS3", "PS4", "PS5", "PS6"]
        },
        {
            "code": "MAT1203",
            "name_vi": "Phân tích và thiết kế hệ thống thông tin",
            "name_en": "Information System Analysis and Design",
            "credits": 4,
            "block": "V",
            "sub_block": "V.3",
            "block_name": "Khối V.3 - Học phần thay thế Khóa luận (7 TC)",
            "type": "Thay thế KLTN",
            "counts_gpa": True,
            "prerequisites": ["MAT3374", "MAT3552E", "MAT1207"],
            "hours": {"theory": 45, "practice": 15, "self_study": 140},
            "language": "Tiếng Việt",
            "recommended_semester": 8,
            "plo": ["PK5", "PS3", "PS4"]
        },
        {
            "code": "MAT3377",
            "name_vi": "Một số vấn đề chọn lọc về Trí tuệ nhân tạo",
            "name_en": "Selected Topics in Artificial Intelligence",
            "credits": 3,
            "block": "V",
            "sub_block": "V.3",
            "block_name": "Khối V.3 - Học phần thay thế Khóa luận (7 TC)",
            "type": "Thay thế KLTN",
            "counts_gpa": True,
            "prerequisites": ["MAT1206E"],
            "hours": {"theory": 30, "practice": 15, "self_study": 105},
            "language": "Tiếng Việt",
            "recommended_semester": 8,
            "plo": ["PK6", "PS2", "PS3"]
        }
    ]
    return courses

def get_knowledge_links():
    links = [
        {
            "source": "MAT3500",
            "target": "MAT1206E",
            "category": "Nền tảng Toán & Logic cho AI",
            "label": "Logic mệnh đề/vị từ & Lý thuyết đồ thị",
            "description": "Cung cấp nền tảng Logic mệnh đề, Logic vị từ, Lý thuyết đồ thị cho các thuật toán tìm kiếm mù/heuristic (BFS, DFS, A*) và suy diễn tri thức trong AI."
        },
        {
            "source": "MAT3514",
            "target": "MAT1206E",
            "category": "Nền tảng Thuật toán cho AI",
            "label": "Search Trees, Priority Queue & Quy hoạch động",
            "description": "Cung cấp cấu trúc Cây tìm kiếm (Search Trees), Hàng đợi ưu tiên (Priority Queue), Bảng băm và kỹ thuật quy hoạch động/quay lui."
        },
        {
            "source": "MAT2323",
            "target": "MAT1206E",
            "category": "Nền tảng Xác suất cho AI",
            "label": "Suy diễn Bayes & Mô hình Markov ẩn",
            "description": "Nền tảng suy diễn xác suất, Định lý Bayes, mạng Bayesian và mô hình Markov ẩn."
        },
        {
            "source": "MAT2400",
            "target": "MAT3533",
            "category": "Toán cốt lõi cho Học máy",
            "label": "Không gian vector, Trị riêng (PCA, SVD)",
            "description": "ĐSTT cung cấp không gian vector, ma trận, trị riêng/vector riêng (PCA, SVD) phục vụ biểu diễn đặc trưng và giảm chiều dữ liệu trong Học máy."
        },
        {
            "source": "MAT2501",
            "target": "MAT3533",
            "category": "Toán cốt lõi cho Học máy",
            "label": "Đạo hàm & Tối ưu hàm mục tiêu",
            "description": "Giải tích 1 & 2 cung cấp nền tảng đạo hàm, chuỗi Taylor và cực trị hàm số cho việc huấn luyện mô hình Học máy."
        },
        {
            "source": "MAT2502",
            "target": "MAT3533",
            "category": "Toán cốt lõi cho Học máy",
            "label": "Đạo hàm riêng & Gradient Descent",
            "description": "Giải tích nhiều biến cung cấp đạo hàm riêng, vector Gradient, ma trận Hessian phục vụ lan truyền ngược (Backpropagation) và Gradient Descent."
        },
        {
            "source": "MAT2407",
            "target": "MAT3533",
            "category": "Toán cốt lõi cho Học máy",
            "label": "Quy hoạch lồi & Nhân tử Lagrange (SVM)",
            "description": "Tối ưu hóa cung cấp quy hoạch lồi, bài toán đối ngẫu và nhân tử Lagrange (cốt lõi của Support Vector Machines - SVM và Neural Networks)."
        },
        {
            "source": "MAT3500",
            "target": "MAT3514",
            "category": "Tư duy Toán Rời rạc & Thuật toán",
            "label": "Quy nạp, Đệ quy, Tổ hợp & Đồ thị",
            "description": "Cung cấp quy nạp toán học, giải hệ thức đệ quy, tổ hợp và lý thuyết đồ thị làm gốc cho Cấu trúc dữ liệu & Thuật toán."
        },
        {
            "source": "MAT3500",
            "target": "MAT3552E",
            "category": "Tư duy Toán Rời rạc & Thuật toán",
            "label": "Độ phức tạp, Hệ thức đệ quy & Đồ thị nâng cao",
            "description": "Cung cấp quy nạp toán học, giải hệ thức đệ quy (Định lý Master), tổ hợp và lý thuyết đồ thị cho Thiết kế và đánh giá thuật toán."
        },
        {
            "source": "MAT3500",
            "target": "MAT3539",
            "category": "Toán cho Mật mã & An toàn thông tin",
            "label": "Số học đồng dư & Số nguyên tố (RSA)",
            "description": "Số học đồng dư, định lý Fermat nhỏ, hàm Euler và số nguyên tố làm nền tảng trực tiếp cho hệ mật khóa công khai RSA, ElGamal."
        },
        {
            "source": "MAT2400",
            "target": "MAT3539",
            "category": "Toán cho Mật mã & An toàn thông tin",
            "label": "Trường hữu hạn & Ma trận (AES, ECC)",
            "description": "Cấu trúc đại số, không gian vector và ma trận trên trường hữu hạn GF(2^n) dùng trong chuẩn mã hóa khối AES và đường cong Elliptic (ECC)."
        },
        {
            "source": "MAT3500",
            "target": "MAT3373E",
            "category": "Toán cho Mật mã & An toàn thông tin",
            "label": "Logic, Số học module & Cơ chế xác thực",
            "description": "Số học đồng dư, số nguyên tố, hàm băm mật mã và logic phân quyền truy cập trong An toàn máy tính."
        },
        {
            "source": "MAT2400",
            "target": "MAT3373E",
            "category": "Toán cho Mật mã & An toàn thông tin",
            "label": "Đại số tuyến tính trong mã hóa dữ liệu",
            "description": "Biến đổi tuyến tính và trường hữu hạn ứng dụng trong các giao thức bảo mật và mã hóa dòng/khối."
        },
        {
            "source": "MAT2323",
            "target": "MAT3534",
            "category": "Nền tảng Khoa học dữ liệu",
            "label": "Kiểm định giả thuyết & Phân phối xác suất",
            "description": "Kiểm định giả thuyết, ước lượng tham số, phân phối xác suất phục vụ phát hiện luật kết hợp, phân cụm và phát hiện bất thường."
        },
        {
            "source": "MAT2400",
            "target": "MAT3534",
            "category": "Nền tảng Khoa học dữ liệu",
            "label": "Ma trận dữ liệu & Giảm chiều (SVD/PCA)",
            "description": "Biểu diễn dữ liệu nhiều chiều bằng ma trận, tính khoảng cách không gian vector và phân rã ma trận trong Khai phá dữ liệu."
        },
        {
            "source": "HUS1023",
            "target": "MAT3534",
            "category": "Nền tảng Khoa học dữ liệu",
            "label": "Tiền xử lý, Trực quan hóa & Thống kê mô tả",
            "description": "Kỹ năng làm sạch dữ liệu, trực quan hóa và phân tích khám phá (EDA) làm bước đệm trực tiếp cho Khai phá dữ liệu."
        },
        {
            "source": "MAT2323",
            "target": "MAT3452",
            "category": "Nền tảng Khoa học dữ liệu",
            "label": "Biến ngẫu nhiên nhiều chiều & Hồi quy",
            "description": "Kiểm định giả thuyết, vector ngẫu nhiên, ma trận hiệp phương sai và hồi quy tuyến tính/logistic."
        },
        {
            "source": "MAT2400",
            "target": "MAT3452",
            "category": "Nền tảng Khoa học dữ liệu",
            "label": "Dạng toàn phương & Trị riêng ma trận hiệp phương sai",
            "description": "ĐSTT giúp chéo hóa ma trận hiệp phương sai, phân tích thành phần chính (PCA) và phân tích nhân tố (Factor Analysis)."
        },
        {
            "source": "HUS1023",
            "target": "MAT3452",
            "category": "Nền tảng Khoa học dữ liệu",
            "label": "Thực hành phân tích thống kê trên bộ dữ liệu thực",
            "description": "Kỹ năng sử dụng công cụ thống kê và đọc hiểu biểu đồ phân phối nhiều chiều."
        },
        {
            "source": "MAT3557",
            "target": "MAT3506",
            "category": "Nền tảng Hệ thống & Mạng",
            "label": "Quản trị mạng Linux, CLI & Cấu hình dịch vụ",
            "description": "Thao tác dòng lệnh, cấu hình network interface, firewall, SSH và công cụ chẩn đoán mạng trên môi trường Linux."
        },
        {
            "source": "MAT3550E",
            "target": "MAT3506",
            "category": "Nền tảng Hệ thống & Mạng",
            "label": "Quản lý tiến trình, I/O & Lập trình Socket",
            "description": "Quản lý tiến trình (Process/Thread), cơ chế giao tiếp liên tiến trình (IPC), đồng bộ hóa và lập trình Socket."
        },
        {
            "source": "MAT3557",
            "target": "MAT3148",
            "category": "Nền tảng Hệ thống & Tính toán hiệu năng cao",
            "label": "Môi trường thực thi HPC/Cluster trên Linux",
            "description": "Biên dịch và chạy các chương trình OpenMP, MPI, CUDA trên hệ thống máy chủ Linux."
        },
        {
            "source": "MAT3550E",
            "target": "MAT3148",
            "category": "Nền tảng Hệ thống & Tính toán hiệu năng cao",
            "label": "Đa luồng (Multithreading), Lập lịch CPU & Đồng bộ hóa",
            "description": "Quản lý Thread, lập lịch CPU đa nhân, tránh Deadlock/Race Condition, Semaphore và Mutex trong Tính toán song song."
        },
        {
            "source": "MAT2503",
            "target": "MAT2034",
            "category": "Nền tảng Giải tích cho Tính toán khoa học",
            "label": "Tích phân bội, Chuỗi hàm & Xấp xỉ hội tụ",
            "description": "Xấp xỉ tích phân số, đánh giá tốc độ hội tụ và sai số cắt cụt trong Giải tích số."
        },
        {
            "source": "MAT2403",
            "target": "MAT2034",
            "category": "Nền tảng Giải tích cho Tính toán khoa học",
            "label": "Giải số PTVP (Euler, Runge-Kutta) & Bài toán biên",
            "description": "Cung cấp lý thuyết bài toán Cauchy và bài toán biên để Giải tích số xây dựng thuật toán xấp xỉ nghiệm (Euler, Runge-Kutta, Sai phân hữu hạn)."
        }
    ]

    # Add MAT1205E -> all courses ending with 'E'
    e_courses = [
        ("MAT1206E", "Nhập môn Trí tuệ nhân tạo"),
        ("MAT3550E", "Nguyên lí hệ điều hành"),
        ("MAT3552E", "Thiết kế và đánh giá thuật toán"),
        ("MAT3373E", "Nhập môn an toàn máy tính"),
        ("MAT3541E", "Nguyên lí các ngôn ngữ lập trình"),
        ("MAT3554E", "Ngôn ngữ hình thức và ôtômat"),
        ("MAT3562E", "Thị giác máy tính"),
        ("MAT3561E", "Xử lí ngôn ngữ tự nhiên và ứng dụng")
    ]
    for code, name in e_courses:
        links.append({
            "source": "MAT1205E",
            "target": code,
            "category": "Năng lực Học thuật Tiếng Anh (Học phần giảng dạy bằng Tiếng Anh)",
            "label": "Đọc hiểu giáo trình quốc tế & Thuật ngữ CS bằng Tiếng Anh",
            "description": f"Kỹ năng đọc tài liệu chuẩn quốc tế, viết báo cáo kỹ thuật và nắm vững thuật ngữ học thuật bằng tiếng Anh cho học phần {code} ({name})."
        })

    return links

def parse_excel_and_build_db(excel_path="Gpa của huân.xlsx"):
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb["Update lần 6"] if "Update lần 6" in wb.sheetnames else wb.active

    excel_records = {}
    for r in range(13, 36):
        idx = ws.cell(r, 1).value
        sem_str = ws.cell(r, 2).value
        raw_name = ws.cell(r, 3).value
        credits = ws.cell(r, 4).value
        score10 = ws.cell(r, 5).value
        letter = ws.cell(r, 6).value
        score4 = ws.cell(r, 7).value

        if raw_name is None:
            continue
        norm_name = str(raw_name).strip().lower()
        code = EXCEL_NAME_TO_CODE.get(norm_name)
        if not code:
            raise ValueError(f"Cannot map Excel course name '{raw_name}' at row {r}")

        sem_num = int(str(sem_str).replace("Kỳ", "").strip()) if sem_str else 1
        excel_records[code] = {
            "order": int(idx) if idx else r - 12,
            "semester": sem_num,
            "semester_label": str(sem_str).strip(),
            "excel_name": str(raw_name).strip(),
            "credits": int(float(credits)),
            "score10": round(float(score10), 2),
            "letter": str(letter).strip(),
            "score4": round(float(score4), 2)
        }

    courses = get_base_curriculum()
    completed_codes = set(excel_records.keys())

    for c in courses:
        code = c["code"]
        if code in excel_records:
            rec = excel_records[code]
            c["completed"] = True
            c["semester"] = rec["semester"]
            c["excel_name"] = rec["excel_name"]
            c["score10"] = rec["score10"]
            c["letter"] = rec["letter"]
            c["score4"] = rec["score4"]
            c["status"] = "completed"
        else:
            c["completed"] = False
            c["semester"] = c["recommended_semester"]
            c["excel_name"] = None
            c["score10"] = None
            c["letter"] = None
            c["score4"] = None
            prereqs = c.get("prerequisites", [])
            if all(p in completed_codes for p in prereqs):
                c["status"] = "ready"
            else:
                c["status"] = "locked"

    # Compute exact metrics
    completed_list = [c for c in courses if c["completed"] and c["counts_gpa"]]
    total_completed_credits = sum(c["credits"] for c in completed_list)
    weighted_sum_4 = sum(c["credits"] * c["score4"] for c in completed_list)
    weighted_sum_10 = sum(c["credits"] * c["score10"] for c in completed_list)
    cpa4_exact = round(weighted_sum_4 / total_completed_credits, 4)
    cpa4_rounded = round(cpa4_exact, 2)
    cpa10_exact = round(weighted_sum_10 / total_completed_credits, 4)
    cpa10_rounded = round(cpa10_exact, 2)

    # Semester history
    semester_stats = []
    cum_credits = 0
    cum_w4 = 0.0
    cum_w10 = 0.0
    for sem in [1, 2, 3, 4]:
        sem_courses = [c for c in completed_list if c["semester"] == sem]
        sem_tc = sum(c["credits"] for c in sem_courses)
        sem_w4 = sum(c["credits"] * c["score4"] for c in sem_courses)
        sem_w10 = sum(c["credits"] * c["score10"] for c in sem_courses)
        cum_credits += sem_tc
        cum_w4 += sem_w4
        cum_w10 += sem_w10
        semester_stats.append({
            "semester": sem,
            "label": f"Kỳ {sem}",
            "credits": sem_tc,
            "gpa4": round(sem_w4 / sem_tc, 2),
            "gpa4_exact": round(sem_w4 / sem_tc, 4),
            "gpa10": round(sem_w10 / sem_tc, 2),
            "cpa4": round(cum_w4 / cum_credits, 2),
            "cpa10": round(cum_w10 / cum_credits, 2),
            "courses_count": len(sem_courses)
        })

    knowledge_links = get_knowledge_links()

    database = {
        "student_profile": {
            "full_name": "Phạm Ngọc Huân",
            "major_name": "Khoa học máy tính và thông tin",
            "major_code": "7480113QTD",
            "university": "Trường Đại học Khoa học Tự nhiên, ĐHQGHN (HUS - VNU)",
            "decision": "Quyết định 3568/QĐ-ĐHKHTN",
            "cohort": "QH-2024-T (Khung chuẩn 129 tín chỉ tính GPA + 15 tín chỉ điều kiện)",
            "current_semester": 4,
            "next_semester": 5
        },
        "summary_metrics": {
            "total_required_gpa_credits": 129,
            "completed_gpa_credits": total_completed_credits,
            "remaining_gpa_credits": 129 - total_completed_credits,
            "completion_percentage": round(total_completed_credits / 129 * 100, 2),
            "completed_courses_count": len(completed_list),
            "total_curriculum_courses_count": len(courses),
            "cpa4": cpa4_rounded,
            "cpa4_exact": cpa4_exact,
            "cpa10": cpa10_rounded,
            "cpa10_exact": cpa10_exact,
            "academic_rank": "Giỏi" if 3.2 <= cpa4_rounded < 3.6 else ("Xuất sắc" if cpa4_rounded >= 3.6 else "Khá")
        },
        "semester_history": semester_stats,
        "blocks_metadata": [
            {
                "id": "I",
                "name": "Khối I - Kiến thức chung",
                "required_credits": 21,
                "note": "Yêu cầu 21 TC tính GPA (còn thiếu THL1057 - Nhà nước & Pháp luật đại cương 2 TC). Chưa tính 15 TC điều kiện (GDQP 8 TC, GDTC 4 TC, Kỹ năng bổ trợ 3 TC)."
            },
            {
                "id": "II",
                "name": "Khối II - Kiến thức theo lĩnh vực",
                "required_credits": 5,
                "note": "Tự chọn tối thiểu 5/13 TC trong giỏ — ĐÃ HOÀN THÀNH 5/5 TC (HUS1021 3 TC + HUS1023 2 TC)."
            },
            {
                "id": "III",
                "name": "Khối III - Kiến thức theo khối ngành",
                "required_credits": 3,
                "note": "Bắt buộc 3/3 TC — ĐÃ HOÀN THÀNH 3/3 TC (MAT2505 - Lập trình cơ bản)."
            },
            {
                "id": "IV",
                "name": "Khối IV - Kiến thức theo nhóm ngành",
                "required_credits": 28,
                "note": "Yêu cầu 28 TC bắt buộc — Đã hoàn thành 22/28 TC. Chỉ còn thiếu 6 TC: MAT2407 (Tối ưu hóa - 3 TC) và MAT1204 (PPNCKH - 3 TC)."
            },
            {
                "id": "V",
                "name": "Khối V - Kiến thức ngành",
                "required_credits": 72,
                "note": "Gồm V.1 Bắt buộc (49 TC, đã học 22 TC, còn 27 TC), V.2.1 Tự chọn kỹ năng PM (chọn 4/8 TC), V.2.2 Tự chọn AI & PTPM (chọn 12/39 TC), V.3 Tốt nghiệp (7 TC)."
            }
        ],
        "plo_definitions": [
            {"code": "PK1", "title": "Kiến thức nền tảng xã hội, pháp luật & khoa học tự nhiên", "group": "Kiến thức (Program Knowledge)"},
            {"code": "PK2", "title": "Toán học ứng dụng, giải tích, đại số, xác suất thống kê & tối ưu hóa", "group": "Kiến thức (Program Knowledge)"},
            {"code": "PK3", "title": "Cốt lõi Khoa học máy tính: Lập trình, Cấu trúc dữ liệu, Thuật toán & Cơ sở dữ liệu", "group": "Kiến thức (Program Knowledge)"},
            {"code": "PK4", "title": "Kiến trúc máy tính, Hệ điều hành, Mạng máy tính, Tính toán song song & An toàn thông tin", "group": "Kiến thức (Program Knowledge)"},
            {"code": "PK5", "title": "Phân tích, thiết kế, phát triển & quản trị dự án Công nghệ phần mềm", "group": "Kiến thức (Program Knowledge)"},
            {"code": "PK6", "title": "Nghiên cứu & ứng dụng Trí tuệ nhân tạo, Học máy, Khoa học dữ liệu & Khai phá thông tin", "group": "Kiến thức (Program Knowledge)"},
            {"code": "PS1", "title": "Kỹ năng lập trình thành thạo, sử dụng công cụ hiện đại và quản trị môi trường Linux", "group": "Kỹ năng (Program Skills)"},
            {"code": "PS2", "title": "Tư duy phản biện, mô hình hóa toán học, thiết kế thuật toán & phân tích dữ liệu", "group": "Kỹ năng (Program Skills)"},
            {"code": "PS3", "title": "Vận dụng tri thức vào bài toán thực tiễn công nghiệp, phát triển hệ thống thông minh", "group": "Kỹ năng (Program Skills)"},
            {"code": "PS4", "title": "Kỹ năng làm việc nhóm, quản lý thời gian, giao tiếp chuyên môn & viết báo cáo khoa học", "group": "Kỹ năng (Program Skills)"},
            {"code": "PS5", "title": "Năng lực ngoại ngữ chuyên ngành, đọc hiểu tài liệu/paper quốc tế bằng tiếng Anh", "group": "Kỹ năng (Program Skills)"},
            {"code": "PS6", "title": "Đạo đức nghề nghiệp, trách nhiệm xã hội và năng lực tự học suốt đời", "group": "Kỹ năng (Program Skills)"}
        ],
        "courses": courses,
        "knowledge_links": knowledge_links
    }

    os.makedirs("data", exist_ok=True)
    with open("data/academic_database.json", "w", encoding="utf-8") as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    with open("curriculum_data.json", "w", encoding="utf-8") as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    # Actual Semester 5 In-Progress Courses of Phạm Ngọc Huân (16 TC)
    sem5_in_progress = {
        "MAT3519": {
            "class_code": "MAT3519 3",
            "note": "Khó, khả năng bỏ",
            "schedule_info": "Thứ 2 (Tiết 7-8, P.202T5) & Thứ 4 (Tiết 10-12, Thực hành)"
        },
        "MAT1206E": {
            "class_code": "MAT1206E 3",
            "note": "Chăm là được",
            "schedule_info": "Thứ 2 (Tiết 3-4, Thực hành) & Thứ 6 (Tiết 7-8, P.506T4)"
        },
        "MAT3533": {
            "class_code": "MAT3533 2",
            "note": "Hơi khó, cố gắng học",
            "schedule_info": "Thứ 2 (Tiết 9-10, P.101T5) & Thứ 4 (Tiết 7-8, Thực hành)"
        },
        "MAT3506": {
            "class_code": "MAT3506 1",
            "note": "Chăm là được",
            "schedule_info": "Thứ 5 (Tiết 7-10, P.302T5)"
        },
        "MAT3505": {
            "class_code": "MAT3505 2",
            "note": "Chăm là được",
            "schedule_info": "Thứ 6 (Tiết 9-10, P.513T4) & Thứ 7 (Tiết 3-4, P.102T5)"
        },
        "THL1057": {
            "class_code": "THL1057 8",
            "note": "Chăm là được",
            "schedule_info": "Thứ 5 (Tiết 4-5, Học Online)"
        }
    }

    # Optimal default plan for Sem 5, 6, 7, 8 matching actual Sem 5 enrollment
    default_planned_semesters = {
        "MAT3519": 5,
        "MAT1206E": 5,
        "MAT3533": 5,
        "MAT3506": 5,
        "MAT3505": 5,
        "THL1057": 5,
        # Kỳ 6 (18 TC)
        "MAT2407": 6,
        "MAT1204": 6,
        "MAT3374": 6,
        "MAT3552E": 6,
        "MAT3534": 6,
        "MAT3561E": 6,
        # Kỳ 7 (17 TC)
        "MAT1207": 7,
        "MAT3373E": 7,
        "MAT3541E": 7,
        "MAT3562E": 7,
        "MAT3452": 7,
        "MAT3558": 7,
        # Kỳ 8 (7 TC)
        "MAT4080": 8
    }

    semester5_timetable = [
        {
            "id": "tt-1",
            "course_code": "MAT1206E",
            "class_code": "MAT1206E 3",
            "course_name": "Trí tuệ nhân tạo (TH)",
            "session_type": "TH",
            "day_of_week": 2,
            "start_period": 3,
            "end_period": 4,
            "room": "Phòng máy TH",
            "note": "Chăm là được",
            "color": "bg-sky-500 text-white border-sky-600"
        },
        {
            "id": "tt-2",
            "course_code": "MAT3519",
            "class_code": "MAT3519 3",
            "course_name": "NNLT thứ 2 (202T5)",
            "session_type": "LT",
            "day_of_week": 2,
            "start_period": 7,
            "end_period": 8,
            "room": "202T5",
            "note": "Khó, khả năng bỏ",
            "color": "bg-cyan-200 text-cyan-950 border-cyan-400"
        },
        {
            "id": "tt-3",
            "course_code": "MAT3533",
            "class_code": "MAT3533 2",
            "course_name": "Học máy (101T5)",
            "session_type": "LT",
            "day_of_week": 2,
            "start_period": 9,
            "end_period": 10,
            "room": "101T5",
            "note": "Hơi khó, cố gắng học",
            "color": "bg-pink-200 text-pink-950 border-pink-400"
        },
        {
            "id": "tt-4",
            "course_code": "MAT3533",
            "class_code": "MAT3533 2",
            "course_name": "Học máy (TH)",
            "session_type": "TH",
            "day_of_week": 4,
            "start_period": 7,
            "end_period": 8,
            "room": "Phòng TH",
            "note": "Hơi khó, cố gắng học",
            "color": "bg-pink-200 text-pink-950 border-pink-400"
        },
        {
            "id": "tt-5",
            "course_code": "MAT3519",
            "class_code": "MAT3519 3",
            "course_name": "NNLT thứ 2 (TH)",
            "session_type": "TH",
            "day_of_week": 4,
            "start_period": 10,
            "end_period": 12,
            "room": "Phòng TH",
            "note": "Khó, khả năng bỏ",
            "color": "bg-cyan-200 text-cyan-950 border-cyan-400"
        },
        {
            "id": "tt-6",
            "course_code": "THL1057",
            "class_code": "THL1057 8",
            "course_name": "NNPLĐC (online)",
            "session_type": "Online",
            "day_of_week": 5,
            "start_period": 4,
            "end_period": 5,
            "room": "Online Zoom/Teams",
            "note": "Chăm là được",
            "color": "bg-orange-200 text-orange-950 border-orange-400"
        },
        {
            "id": "tt-7",
            "course_code": "MAT3506",
            "class_code": "MAT3506 1",
            "course_name": "Mạng máy tính (302T5)",
            "session_type": "LT",
            "day_of_week": 5,
            "start_period": 7,
            "end_period": 10,
            "room": "302T5",
            "note": "Chăm là được",
            "color": "bg-emerald-200 text-emerald-950 border-emerald-400"
        },
        {
            "id": "tt-8",
            "course_code": "MAT1206E",
            "class_code": "MAT1206E 3",
            "course_name": "Trí tuệ nhân tạo (506T4)",
            "session_type": "LT",
            "day_of_week": 6,
            "start_period": 7,
            "end_period": 8,
            "room": "506T4",
            "note": "Chăm là được",
            "color": "bg-sky-500 text-white border-sky-600"
        },
        {
            "id": "tt-9",
            "course_code": "MAT3505",
            "class_code": "MAT3505 2",
            "course_name": "Kiến trúc MT (513T4)",
            "session_type": "LT",
            "day_of_week": 6,
            "start_period": 9,
            "end_period": 10,
            "room": "513T4",
            "note": "Chăm là được",
            "color": "bg-lime-500 text-white border-lime-600"
        },
        {
            "id": "tt-10",
            "course_code": "MAT3505",
            "class_code": "MAT3505 2",
            "course_name": "Kiến trúc MT (102T5)",
            "session_type": "TH",
            "day_of_week": 7,
            "start_period": 3,
            "end_period": 4,
            "room": "102T5",
            "note": "Chăm là được",
            "color": "bg-lime-500 text-white border-lime-600"
        }
    ]

    user_progress = {
        "courses_state": {
            c["code"]: {
                "completed": c["completed"],
                "in_progress": c["code"] in sem5_in_progress,
                "score10": c["score10"],
                "letter": c["letter"],
                "score4": c["score4"],
                "semester": 5 if c["code"] in sem5_in_progress else c["semester"],
                "planned_semester": default_planned_semesters.get(
                    c["code"],
                    c["recommended_semester"] if not c["completed"] else c["semester"]
                ),
                "note": sem5_in_progress.get(c["code"], {}).get("note", ""),
                "teacher_note": (
                    "Nên học thầy Phan, không nên học thầy Dũng."
                    if c["code"] == "MAT2407"
                    else ""
                ),
                "schedule_info": sem5_in_progress.get(c["code"], {}).get("schedule_info", "")
            }
            for c in courses
        },
        "conditional_checklist": {
            "CME1000": True,
            "PES1000": False,
            "HUS1012": False
        },
        "selected_interests": [
            "ai_nlp",
            "data_science",
            "applied_math"
        ],
        "graduation_option": "thesis",
        "target_cpa": 3.40,
        "retake_plan": {},
        "semester5_timetable": semester5_timetable,
        "custom_memories": [
            {
                "id": "mem-init-2",
                "topic": "Ghi chú chọn giảng viên MAT2407 - Tối ưu hóa",
                "course_code": "MAT2407",
                "content": "Môn Tối ưu hóa (MAT2407) nên học thầy Phan, không nên học thầy Dũng.",
                "created_at": "08/11/2026"
            },
            {
                "id": "mem-init-1",
                "topic": "Lịch học thực tế Kỳ 5 (16 TC) & NCKH NLP",
                "course_code": "KỲ 5",
                "content": "Kỳ 5 hiện tại Huân đang học 6 môn (16 TC): MAT3519 3 (NNLT thứ 2 - 2TC, khó, khả năng bỏ), MAT1206E 3 (Trí tuệ nhân tạo - 3TC, chăm là được), MAT3533 2 (Học máy - 3TC, hơi khó, cố gắng học), MAT3506 1 (Mạng máy tính - 3TC, chăm là được), MAT3505 2 (Kiến trúc máy tính - 3TC, chăm là được), THL1057 8 (Nhà nước & Pháp luật đại cương - 2TC, học online, chăm là được) và đang thực hiện Nghiên cứu khoa học (NCKH) về Xử lý ngôn ngữ tự nhiên (NLP).",
                "created_at": "08/11/2026"
            }
        ],
        "semester5_tasks": [
            {
                "id": "task-1",
                "course_code": "NCKH_NLP",
                "category": "nlp_research",
                "title": "Đọc & tổng hợp Literature Review (Related Works) cho đề tài NCKH NLP",
                "due_date": "2026-11-20",
                "priority": "high",
                "completed": False,
                "details": "Tổng hợp 10-15 bài báo mới nhất (ACL/EMNLP/NAACL) và chuẩn bị bộ dữ liệu tiếng Việt."
            },
            {
                "id": "task-2",
                "course_code": "MAT3533",
                "category": "assignment",
                "title": "Bài tập thực hành Học máy: Cài đặt Linear/Logistic Regression & SVM",
                "due_date": "2026-11-18",
                "priority": "high",
                "completed": False,
                "details": "Nộp notebook thực hành chiều Thứ 4 (Lớp MAT3533 2)."
            },
            {
                "id": "task-3",
                "course_code": "MAT1206E",
                "category": "project",
                "title": "Bài tập lớn Trí tuệ nhân tạo: Cài đặt thuật toán tìm kiếm A* & Minimax",
                "due_date": "2026-11-25",
                "priority": "high",
                "completed": False,
                "details": "Lớp MAT1206E 3 - Thực hành sáng Thứ 2 (Tiết 3-4) & Lý thuyết chiều Thứ 6 (506T4)."
            },
            {
                "id": "task-4",
                "course_code": "MAT3506",
                "category": "exam",
                "title": "Kiểm tra giữa kỳ Mạng máy tính (Chia Subnet IPv4 & Định tuyến)",
                "due_date": "2026-11-27",
                "priority": "medium",
                "completed": False,
                "details": "Ôn kỹ tầng Network & Transport, thực hành bắt gói tin Wireshark tại phòng 302T5."
            },
            {
                "id": "task-5",
                "course_code": "MAT3505",
                "category": "assignment",
                "title": "Bài tập Kiến trúc máy tính: Tính toán bộ nhớ Cache & Hợp ngữ MIPS",
                "due_date": "2026-11-29",
                "priority": "medium",
                "completed": False,
                "details": "Lớp MAT3505 2 - Phòng 513T4 (Thứ 6) và 102T5 (Sáng Thứ 7)."
            },
            {
                "id": "task-6",
                "course_code": "THL1057",
                "category": "exam",
                "title": "Bài tiểu luận / Kiểm tra giữa kỳ Nhà nước và Pháp luật đại cương",
                "due_date": "2026-12-03",
                "priority": "low",
                "completed": False,
                "details": "Lớp THL1057 8 học Online sáng Thứ 5 (Tiết 4-5)."
            }
        ],
        "nlp_research": {
            "topic_title": "Nghiên cứu Mô hình Ngôn ngữ Lớn (LLM) / RAG & Xử lý Ngôn ngữ Tự nhiên Tiếng Việt",
            "advisor_name": "Giảng viên hướng dẫn Khoa Toán - Cơ - Tin học (HUS)",
            "research_goal": "Xây dựng mô hình NLP thực nghiệm kết hợp kiến thức Học máy (MAT3533) và Trí tuệ nhân tạo (MAT1206E), hướng tới công bố bài báo Hội nghị Sinh viên NCKH cấp Khoa/Trường và phát triển thành Khóa luận tốt nghiệp (MAT4080 - 7 TC đạt A+).",
            "datasets_and_models": "PhoBERT / ViT5 / Qwen / Llama-3-Vi, HuggingFace Transformers, PyTorch, LangChain, VectorDB (FAISS/Chroma)",
            "paper_links": [
                "Attention Is All You Need (Vaswani et al.) - Kiến trúc Transformer cốt lõi",
                "PhoBERT: Pre-trained language models for Vietnamese (VinAI Research)",
                "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al.)"
            ],
            "quick_notes": "• Tận dụng lợi thế điểm A Xác suất thống kê (8.8), Cơ sở dữ liệu (8.5) và Tiếng Anh chuyên ngành (8.0).\n• Liên hệ chặt chẽ với môn Học máy (MAT3533) đang học ở Kỳ 5 và mở đường cho môn Xử lí ngôn ngữ tự nhiên (MAT3561E) ở Kỳ 6.",
            "milestones": [
                {
                    "id": "nlp-m1",
                    "phase": "Giai đoạn 1 (Tháng 10 - 11)",
                    "title": "Xác định bài toán NLP, khảo sát bài báo (Literature Review) & thu thập Dataset",
                    "status": "in_progress",
                    "target_date": "Tháng 11/2026",
                    "notes": "Đọc các paper nền tảng về Transformer, Pre-trained Language Models và chuẩn hóa bộ dữ liệu tiếng Việt.",
                    "deliverable": "Bản tổng quan tài liệu (Related Works) + Bộ dữ liệu sạch"
                },
                {
                    "id": "nlp-m2",
                    "phase": "Giai đoạn 2 (Tháng 12 - 01)",
                    "title": "Xây dựng Baseline Model & Huấn luyện / Fine-tuning thực nghiệm",
                    "status": "upcoming",
                    "target_date": "Tháng 01/2027",
                    "notes": "Cài đặt mô hình cơ sở (TF-IDF/SVM từ môn Học máy + PhoBERT/LLM), đánh giá độ đo F1-score, BLEU/ROUGE.",
                    "deliverable": "Source code thực nghiệm + Bảng kết quả so sánh Baseline"
                },
                {
                    "id": "nlp-m3",
                    "phase": "Giai đoạn 3 (Tháng 02 - 03)",
                    "title": "Cải tiến mô hình đề xuất & Phân tích lỗi (Ablation Study)",
                    "status": "upcoming",
                    "target_date": "Tháng 03/2027",
                    "notes": "Tối ưu hóa kiến trúc/prompt/hyperparameters và kiểm chứng thống kê.",
                    "deliverable": "Bảng kết quả cải tiến vượt Baseline"
                },
                {
                    "id": "nlp-m4",
                    "phase": "Giai đoạn 4 (Tháng 04 - 05)",
                    "title": "Viết báo cáo NCKH chuẩn LaTeX & Báo cáo tại Hội nghị SV NCKH HUS",
                    "status": "upcoming",
                    "target_date": "Tháng 04/2027",
                    "notes": "Hoàn thiện báo cáo khoa học và slide thuyết trình.",
                    "deliverable": "Báo cáo toàn văn NCKH + Giải thưởng NCKH Sinh viên"
                }
            ]
        }
    }
    with open("data/user_progress.json", "w", encoding="utf-8") as f:
        json.dump(user_progress, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated database with {len(courses)} courses ({sum(1 for c in courses if c['counts_gpa'])} GPA courses + {sum(1 for c in courses if not c['counts_gpa'])} conditional courses).")
    print(f"Completed courses: {len(completed_list)} | Total GPA credits: {total_completed_credits}/129")
    print(f"CPA 4: {cpa4_rounded} (exact: {cpa4_exact}) | CPA 10: {cpa10_rounded} (exact: {cpa10_exact})")
    print(f"Knowledge links count: {len(knowledge_links)}")

if __name__ == "__main__":
    parse_excel_and_build_db()
