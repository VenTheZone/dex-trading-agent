# CORS Configuration - Allow all origins for production compatibility
# Note: For local-only deployment, this is acceptable. For public deployment, restrict origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production/Docker deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)