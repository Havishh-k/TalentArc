import pandas as pd

def create_mock_excel():
    data = [
        {
            "Full Name": "Arjun Menon",
            "Current Title": "Senior Frontend Engineer",
            "Current Company": "Flipkart",
            "Years Experience": 6.5,
            "Location": "Bengaluru, India",
            "Skills": "React, TypeScript, Redux, TailwindCSS, Webpack",
            "Key Project Summary": "Led the migration of the core checkout flow from legacy AngularJS to React. Implemented advanced state management with Redux Toolkit and reduced bundle size by 40%. The new architecture improved page load speeds by 2 seconds and directly increased conversion rates during the Big Billion Days sale.",
            "Total Companies Worked For": 3,
            "Months in Current Role": 28
        },
        {
            "Full Name": "Simran Kaur",
            "Current Title": "Lead Data Scientist",
            "Current Company": "Swiggy",
            "Years Experience": 8.0,
            "Location": "Gurugram, India",
            "Skills": "Python, PyTorch, SQL, AWS SageMaker, Recommendation Systems",
            "Key Project Summary": "Designed and deployed a deep learning recommendation engine using PyTorch to personalize restaurant feeds for users. Orchestrated the ML pipeline using AWS SageMaker and Airflow. The model achieved a 15% increase in click-through rates and successfully scaled to handle millions of daily active users.",
            "Total Companies Worked For": 2,
            "Months in Current Role": 42
        },
        {
            "Full Name": "Ravi Teja",
            "Current Title": "DevOps Architect",
            "Current Company": "Zomato",
            "Years Experience": 11.0,
            "Location": "Hyderabad, India",
            "Skills": "Kubernetes, Docker, Terraform, AWS, CI/CD, Go",
            "Key Project Summary": "Architected the multi-region Kubernetes infrastructure to ensure 99.99% uptime during peak food delivery hours. Automated infrastructure provisioning using Terraform and built custom CI/CD pipelines in Go that reduced deployment times from hours to under 15 minutes.",
            "Total Companies Worked For": 4,
            "Months in Current Role": 18
        }
    ]

    df = pd.DataFrame(data)
    df.to_excel("test_candidates.xlsx", index=False)
    print("Created test_candidates.xlsx successfully.")

if __name__ == "__main__":
    create_mock_excel()
