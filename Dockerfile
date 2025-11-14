# Copy built application from builder
COPY --from=builder /app/dist ./dist