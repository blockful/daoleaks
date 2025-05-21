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

# Create a non-root user to run the applications
RUN useradd -m -s /bin/bash noir
USER noir
WORKDIR /home/noir

# Install Rust and Cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Add .cargo/bin to PATH
ENV PATH="/home/noir/.cargo/bin:${PATH}"

# Install noirup and set up PATH correctly
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
# The noirup installer tells us it's installed to .nargo/bin
ENV PATH="/home/noir/.nargo/bin:${PATH}"

# Run noirup to install Noir
RUN bash -c 'source $HOME/.bashrc && if [ -f "$HOME/.nargo/bin/noirup" ]; then $HOME/.nargo/bin/noirup; elif [ -f "$HOME/.cargo/bin/noirup" ]; then $HOME/.cargo/bin/noirup; else echo "noirup not found"; exit 1; fi'

# Install Barretenberg (bbup)
RUN curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
ENV PATH="/home/noir/.bb:${PATH}"

# Run bbup to install Barretenberg
RUN bash -c 'source $HOME/.bashrc && if [ -f "$HOME/.bb/bbup" ]; then $HOME/.bb/bbup; else echo "bbup not found"; exit 1; fi'

# Add all bin directories to PATH
ENV PATH="/home/noir/.cargo/bin:/home/noir/.nargo/bin:/home/noir/.bb/bin:${PATH}"

# Create a directory for Noir projects
RUN mkdir -p /home/noir/projects

# Create a script to verify installation and set up shell completions
RUN echo '#!/bin/bash' > /home/noir/setup.sh && \
    echo 'export PATH="$HOME/.cargo/bin:$HOME/.nargo/bin:$HOME/.bb/bin:$PATH"' >> /home/noir/setup.sh && \
    echo 'echo "Checking for nargo..."' >> /home/noir/setup.sh && \
    echo 'if command -v nargo &> /dev/null; then' >> /home/noir/setup.sh && \
    echo '    echo "nargo is installed at $(which nargo)"' >> /home/noir/setup.sh && \
    echo '    mkdir -p $HOME/.local/share/bash-completion/completions' >> /home/noir/setup.sh && \
    echo '    nargo completions bash > $HOME/.local/share/bash-completion/completions/nargo' >> /home/noir/setup.sh && \
    echo '    echo "source $HOME/.local/share/bash-completion/completions/nargo" >> $HOME/.bashrc' >> /home/noir/setup.sh && \
    echo 'else' >> /home/noir/setup.sh && \
    echo '    echo "nargo is not installed. Please check installation."' >> /home/noir/setup.sh && \
    echo 'fi' >> /home/noir/setup.sh && \
    echo 'echo "Checking for bb..."' >> /home/noir/setup.sh && \
    echo 'if command -v bb &> /dev/null; then' >> /home/noir/setup.sh && \
    echo '    echo "bb is installed at $(which bb)"' >> /home/noir/setup.sh && \
    echo 'else' >> /home/noir/setup.sh && \
    echo '    echo "bb is not installed. Please check installation."' >> /home/noir/setup.sh && \
    echo 'fi' >> /home/noir/setup.sh && \
    chmod +x /home/noir/setup.sh

# Set working directory to projects
WORKDIR /home/noir/projects

# When container starts, run setup script then launch bash
ENTRYPOINT ["/bin/bash", "-c", "/home/noir/setup.sh && exec /bin/bash"]