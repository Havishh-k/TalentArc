import json
import random

with open('app/data/mock_candidates.json', 'r', encoding='utf-8') as f:
    candidates = json.load(f)

current_count = len(candidates)
if current_count < 50:
    first_names = ["Rahul", "Priya", "Amit", "Neha", "Vikram", "Sneha", "Rohan", "Pooja", "Karan", "Anjali"]
    last_names = ["Sharma", "Verma", "Singh", "Patel", "Gupta", "Kumar", "Reddy", "Iyer", "Nair", "Das"]
    titles = ["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer", "Frontend Developer", "Backend Developer", "ML Engineer", "Data Analyst", "Engineering Manager"]
    companies = ["TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra", "Cognizant", "Accenture", "IBM", "Capgemini", "Amazon", "Microsoft", "Google", "Flipkart", "Swiggy", "Zomato", "Uber"]
    locations = ["Bengaluru, India", "Hyderabad, India", "Pune, India", "Mumbai, India", "Chennai, India", "Gurugram, India", "Noida, India", "Delhi, India"]
    skills_pool = ["Python", "Java", "JavaScript", "TypeScript", "Go", "C++", "SQL", "PyTorch", "TensorFlow", "MLOps", "MLflow", "Kubernetes", "Docker", "Spark", "Kafka", "Airflow", "FastAPI", "React", "Node.js", "System Design", "Microservices", "AWS", "GCP", "Azure", "NLP", "Computer Vision", "Transformers", "Redis", "PostgreSQL", "Communication", "Leadership", "Distributed Systems"]
    degrees = ["B.Tech Computer Science", "M.Tech Computer Science", "B.E. Information Technology", "M.S. Data Science", "B.Tech Electronics"]
    institutions = ["IIT Bombay", "IIT Delhi", "IIT Kanpur", "IIT Madras", "BITS Pilani", "NIT Trichy", "IIIT Hyderabad", "VIT Vellore", "Manipal Institute of Technology", "Delhi Technological University"]

    for i in range(current_count + 1, 51):
        c_id = f"c{i:03d}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        full_name = f"{fname} {lname}"
        title = random.choice(titles)
        company = random.choice(companies)
        years_exp = round(random.uniform(1.0, 15.0), 1)
        location = random.choice(locations)
        
        num_skills = random.randint(4, 8)
        skills = random.sample(skills_pool, num_skills)
        
        candidate = {
            "candidate_id": c_id,
            "personal": {
                "full_name": full_name,
                "display_photo_url": f"/avatars/{c_id}.png",
                "current_title": title,
                "current_company": company,
                "location": location,
                "years_experience": years_exp
            },
            "education": [
                {
                    "institution": random.choice(institutions),
                    "degree": random.choice(degrees),
                    "graduation_year": 2024 - int(years_exp)
                }
            ],
            "career_history": [
                {
                    "company": company,
                    "title": title,
                    "start_month": "2020-01",
                    "end_month": None,
                    "tenure_months": int(years_exp * 12)
                }
            ],
            "skills": skills,
            "projects": [
                {
                    "title": f"Enterprise {title} Project",
                    "description": f"Led the development of a scalable system utilizing {skills[0]} and {skills[1] if len(skills)>1 else 'SQL'} to improve performance by 20%.",
                    "technologies": skills[:3]
                }
            ],
            "behavioral_metadata": {
                "avg_tenure_months": round(random.uniform(10.0, 40.0), 1),
                "num_companies_total": random.randint(1, 4),
                "num_companies_last_3yr": random.randint(0, 3),
                "promotion_speed_months": random.randint(12, 48),
                "title_progression_score": round(random.uniform(4.0, 9.5), 1)
            },
            "computed_at_seed": {
                "embedding_model": "all-MiniLM-L6-v2",
                "embedded_text_preview": f"{title} {company} {' '.join(skills[:3])}..."
            }
        }
        candidates.append(candidate)

    with open('app/data/mock_candidates.json', 'w', encoding='utf-8') as f:
        json.dump(candidates, f, indent=2)
    print(f"Added {50 - current_count} candidates. Total is now 50.")
else:
    print("Already 50 candidates.")
