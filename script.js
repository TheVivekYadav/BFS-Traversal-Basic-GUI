document.addEventListener('DOMContentLoaded', () => {
    const graphContainer = document.getElementById('graph-container');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const startNodeSelect = document.getElementById('startNode');
    const queueDisplay = document.getElementById('queue-display');
    const visitedDisplay = document.getElementById('visited-display');
    const addNodeBtn = document.getElementById('add-node-btn');
    const addEdgeBtn = document.getElementById('add-edge-btn');
    const clearGraphBtn = document.getElementById('clear-graph-btn');

    let graph = {}; // Adjacency list
    let nodeCount = 0;
    let mode = 'add-node'; // 'add-node' or 'add-edge'

    let queue = [];
    let visited = new Set();
    let animationInterval;
    let nodeElements = {};
    let edgeElements = {};

    // For adding edges
    let isDrawing = false;
    let startNodeForEdge = null;
    let tempEdge = null;
    
    // --- Graph Creation Logic ---
    addNodeBtn.addEventListener('click', () => {
        mode = 'add-node';
        addNodeBtn.classList.add('active');
        addEdgeBtn.classList.remove('active');
        document.body.style.cursor = 'crosshair';
    });

    addEdgeBtn.addEventListener('click', () => {
        mode = 'add-edge';
        addEdgeBtn.classList.add('active');
        addNodeBtn.classList.remove('active');
        document.body.style.cursor = 'default';
    });

    clearGraphBtn.addEventListener('click', () => {
        reset();
        graph = {};
        nodeCount = 0;
        graphContainer.innerHTML = '';
        startNodeSelect.innerHTML = '';
        startBtn.disabled = true;
        resetBtn.disabled = true;
    });

    graphContainer.addEventListener('click', (e) => {
        if (mode === 'add-node') {
            // Check if the click was on the graph container itself, not a node
            if (e.target.id === 'graph-container') {
                nodeCount++;
                const nodeId = `Node ${nodeCount}`;
                const nodeElement = createNodeElement(nodeId, e.offsetX, e.offsetY);
                graphContainer.appendChild(nodeElement);
                
                graph[nodeId] = []; // Add the new node to the graph
                nodeElements[nodeId] = nodeElement;

                // Update the dropdown and buttons
                updateNodeSelection();
                
                // Add event listeners for new node
                nodeElement.addEventListener('mousedown', handleNodeMouseDown);
            }
        }
    });

    function createNodeElement(id, x, y) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'node';
        nodeElement.id = id;
        nodeElement.innerText = id;
        nodeElement.style.left = `${x - 25}px`;
        nodeElement.style.top = `${y - 25}px`;
        return nodeElement;
    }

    function handleNodeMouseDown(e) {
        if (mode === 'add-edge') {
            e.stopPropagation(); // Prevent the container click event from firing
            isDrawing = true;
            startNodeForEdge = e.target.id;

            // Get SVG for drawing
            let svg = graphContainer.querySelector('svg');
            if (!svg) {
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", "100%");
                svg.setAttribute("height", "100%");
                graphContainer.appendChild(svg);
            }

            tempEdge = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tempEdge.setAttribute('class', 'temp-edge');
            const startX = e.target.offsetLeft + 25;
            const startY = e.target.offsetTop + 25;
            tempEdge.setAttribute('x1', startX);
            tempEdge.setAttribute('y1', startY);
            tempEdge.setAttribute('x2', startX);
            tempEdge.setAttribute('y2', startY);
            svg.appendChild(tempEdge);
        }
    }

    graphContainer.addEventListener('mousemove', (e) => {
        if (isDrawing && tempEdge) {
            const containerRect = graphContainer.getBoundingClientRect();
            const mouseX = e.clientX - containerRect.left;
            const mouseY = e.clientY - containerRect.top;
            tempEdge.setAttribute('x2', mouseX);
            tempEdge.setAttribute('y2', mouseY);
        }
    });

    graphContainer.addEventListener('mouseup', (e) => {
        if (isDrawing) {
            isDrawing = false;
            
            if (tempEdge) {
                tempEdge.remove();
                tempEdge = null;
            }

            const endNodeElement = e.target.closest('.node');
            if (endNodeElement && endNodeElement.id !== startNodeForEdge) {
                const endNodeId = endNodeElement.id;
                
                // Check if edge already exists
                if (!graph[startNodeForEdge].includes(endNodeId)) {
                    // Add edge to graph data
                    graph[startNodeForEdge].push(endNodeId);
                    graph[endNodeId].push(startNodeForEdge); // For an undirected graph

                    // Draw the permanent edge
                    let svg = graphContainer.querySelector('svg');
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    const startNodePos = { x: nodeElements[startNodeForEdge].offsetLeft + 25, y: nodeElements[startNodeForEdge].offsetTop + 25 };
                    const endNodePos = { x: endNodeElement.offsetLeft + 25, y: endNodeElement.offsetTop + 25 };

                    line.setAttribute('x1', startNodePos.x);
                    line.setAttribute('y1', startNodePos.y);
                    line.setAttribute('x2', endNodePos.x);
                    line.setAttribute('y2', endNodePos.y);
                    line.setAttribute('class', 'edge');
                    svg.appendChild(line);

                    const edgeKey = startNodeForEdge < endNodeId ? `${startNodeForEdge}-${endNodeId}` : `${endNodeId}-${startNodeForEdge}`;
                    edgeElements[edgeKey] = line;
                }
            }
        }
    });

    function updateNodeSelection() {
        const nodeKeys = Object.keys(graph);
        startNodeSelect.innerHTML = nodeKeys.map(node => `<option value="${node}">${node}</option>`).join('');
        startBtn.disabled = nodeKeys.length === 0;
        resetBtn.disabled = nodeKeys.length === 0;
    }

    // --- BFS Traversal Logic (remains largely the same) ---
    function updateVisuals() {
        queueDisplay.innerHTML = queue.map(node => `<div class="queue-item">${node}</div>`).join('');
        visitedDisplay.innerHTML = Array.from(visited).map(node => `<div class="visited-item">${node}</div>`).join('');

        for (const node in nodeElements) {
            const element = nodeElements[node];
            element.classList.remove('start', 'current', 'queued', 'visited');

            if (node === startNodeSelect.value) {
                element.classList.add('start');
            }
            if (visited.has(node)) {
                element.classList.add('visited');
            }
            if (queue.includes(node)) {
                element.classList.add('queued');
            }
            if (queue[0] === node) {
                element.classList.add('current');
            }
        }
    }

    function animateBFS() {
        if (queue.length === 0) {
            clearInterval(animationInterval);
            if (nodeElements[startNodeSelect.value]) {
                nodeElements[startNodeSelect.value].classList.remove('current');
            }
            console.log("BFS traversal complete.");
            return;
        }

        const currentNode = queue.shift();
        
        const previousNode = document.querySelector('.node.current');
        if (previousNode) {
            previousNode.classList.remove('current');
        }

        if (nodeElements[currentNode]) {
            nodeElements[currentNode].classList.add('current');
        }

        visited.add(currentNode);
        updateVisuals();
        
        setTimeout(() => {
            for (const neighbor of graph[currentNode] || []) {
                if (!visited.has(neighbor) && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                    const edgeKey = currentNode < neighbor ? `${currentNode}-${neighbor}` : `${neighbor}-${currentNode}`;
                    const edge = edgeElements[edgeKey];
                    if (edge) {
                        edge.classList.add('active');
                    }
                }
            }
            updateVisuals();
        }, 1000);
    }

    function startTraversal() {
        const startNode = startNodeSelect.value;
        if (!startNode || !graph[startNode]) {
            alert("Please create a graph and select a starting node.");
            return;
        }

        reset();
        
        queue.push(startNode);
        visited.add(startNode);
        updateVisuals();

        startBtn.disabled = true;
        resetBtn.disabled = false;
        animationInterval = setInterval(animateBFS, 2000);
    }

    function reset() {
        clearInterval(animationInterval);
        queue = [];
        visited.clear();
        for (const node in nodeElements) {
            const element = nodeElements[node];
            element.classList.remove('start', 'current', 'queued', 'visited');
        }
        for (const edgeKey in edgeElements) {
            edgeElements[edgeKey].classList.remove('active');
        }
        queueDisplay.innerHTML = '';
        visitedDisplay.innerHTML = '';
        startBtn.disabled = Object.keys(graph).length === 0;
        resetBtn.disabled = true;
        updateNodeSelection();
    }
    
    // Event listeners
    startBtn.addEventListener('click', startTraversal);
    resetBtn.addEventListener('click', reset);

    // Initial state
    document.body.style.cursor = 'crosshair';
});