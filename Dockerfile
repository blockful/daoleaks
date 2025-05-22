# Environment to access nargo and bb tools

# Use Ubuntu 24.04 (Noble Numbat) as the base image
FROM ubuntu:24.04

# Set non-interactive installation mode
ENV DEBIAN_FRONTEND=noninteractive

# Update and install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    jq \
    build-essential \
    pkg-config \
    libssl-dev \
    nodejs \
    npm \
    bash-completion \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Create directory for projects
RUN mkdir -p /workspace

# Set working directory
WORKDIR /workspace

# Install Rust globally
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Foundry (includes forge, cast, anvil, chisel)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"

# Install the Foundry tools
RUN /root/.foundry/bin/foundryup

# Install noirup globally
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
ENV PATH="/root/.nargo/bin:${PATH}"

# Install Noir
RUN /root/.nargo/bin/noirup

# Install Barretenberg
RUN curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
ENV PATH="/root/.bb/bin:${PATH}"

# Install bb
RUN /root/.bb/bbup

# Set final PATH
ENV PATH="/root/.cargo/bin:/root/.foundry/bin:/root/.nargo/bin:/root/.bb/bin:${PATH}"

# Default command
CMD ["/bin/bash"]