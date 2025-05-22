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

# Install Rust and Cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Foundry (includes forge, cast, anvil, chisel)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN bash -c 'source $HOME/.bashrc && foundryup'

# Install noirup and set up PATH correctly
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
ENV PATH="/root/.nargo/bin:${PATH}"

# Run noirup to install Noir
RUN bash -c 'source $HOME/.bashrc && if [ -f "$HOME/.nargo/bin/noirup" ]; then $HOME/.nargo/bin/noirup; elif [ -f "$HOME/.cargo/bin/noirup" ]; then $HOME/.cargo/bin/noirup; else echo "noirup not found"; exit 1; fi'

# Install Barretenberg (bbup)
RUN curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
ENV PATH="/root/.bb:${PATH}"

# Run bbup to install Barretenberg
RUN bash -c 'source $HOME/.bashrc && if [ -f "$HOME/.bb/bbup" ]; then $HOME/.bb/bbup; else echo "bbup not found"; exit 1; fi'

# Add all bin directories to PATH
ENV PATH="/root/.cargo/bin:/root/.nargo/bin:/root/.bb/bin:${PATH}"

# Create a directory for projects
RUN mkdir -p /workspaces

# Set working directory
WORKDIR /workspaces

