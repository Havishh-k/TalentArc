import pandas as pd
from faker import Faker
import random

fake = Faker('en_IN') # Uses Indian localized names/companies

# Dictionaries for tech-specific generation
tech_roles = ["Frontend Developer", "Backend Engineer", "Data Scientist", "ML Engineer", "DevOps Engineer", "Full Stack Developer", "Cloud Architect"]
companies = ["TCS", "Infosys", "Wipro", "Flipkart", "Swiggy", "Zomato", "Cred", "Razorpay", "Ola", "Paytm"]
tech_skills = ["Python, SQL, AWS", "React, Node.js, MongoDB", "Java, Spring Boot, Kafka", "PyTorch, TensorFlow, Pandas", "Terraform, Kubernetes, Docker"]
projects = [
    ("Payment Gateway Refactor", "Rewrote legacy monolith into microservices, improving throughput by 40%."),
    ("Recommendation Engine", "Built a collaborative filtering model that increased user engagement by 15%."),
    ("CI/CD Automation", "Automated deployment pipelines reducing release times from days to hours."),
    ("Real-time Analytics Dashboard", "Created a React-based dashboard visualizing streaming data via WebSockets."),
    ("Database Migration", "Migrated 10TB of relational data to NoSQL with zero data loss.")
]

def generate_massive_dataset(num_rows):
    data = []
    for _ in range(num_rows):
        exp = round(random.uniform(1.0, 15.0), 1)
        proj = random.choice(projects)
        
        row = {
            "full_name": fake.name(),
            "current_title": random.choice(tech_roles),
            "current_company": random.choice(companies),
            "years_experience": exp,
            "skills": random.choice(tech_skills),
            "project_1_title": proj[0],
            "project_1_description": proj[1],
            "avg_tenure_months": random.randint(8, 60),
            "num_companies_last_3yr": random.randint(0, 4),
            "promotion_speed_months": random.randint(10, 48),
            "title_progression_score": round(random.uniform(3.0, 10.0), 1)
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    df.to_csv("massive_candidate_pool.csv", index=False)
    print(f"Successfully generated {num_rows} rows in 'massive_candidate_pool.csv'")

# Generate 10,000 candidates
generate_massive_dataset(450)


