.PHONY: submit

submit:
	@echo "==================================================="
	@echo "    TalentArc Hackathon - Phase 3 Submission"
	@echo "==================================================="
	@echo "1. Running Offline Ranking pipeline..."
	@PYTHONPATH=backend python backend/rank.py
	@echo "2. Running TRD Validations..."
	@PYTHONPATH=backend python backend/validate_submission.py
	@echo "==================================================="
	@echo "   SUBMISSION READY - submission.csv verified"
	@echo "==================================================="
