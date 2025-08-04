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

    // For adding edges (mouse and touch)
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

    // Unified event handler for mouse and touch to add nodes
    graphContainer.addEventListener('mousedown', handleContainerInteraction);
    graphContainer.addEventListener('touchstart', handleContainerInteraction);

    function handleContainerInteraction(e) {
        // Only trigger on the container itself, not on a child node
        if (e.target.id !== 'graph-container') return;

        if (mode === 'add-node') {
            e.preventDefault(); // Prevent default touch behavior
            const rect = graphContainer.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            const offsetX = clientX - rect.left;
            const offsetY = clientY - rect.top;

            nodeCount++;
            const nodeId = `Node ${nodeCount}`;
            const nodeElement = createNodeElement(nodeId, offsetX, offsetY);
            graphContainer.appendChild(nodeElement);
            
            graph[nodeId] = []; // Add the new node to the graph
            nodeElements[nodeId] = nodeElement;

            // Update the dropdown and buttons
            updateNodeSelection();
            
            // Add event listeners for the new node
            nodeElement.addEventListener('mousedown', handleNodeInteraction);
            nodeElement.addEventListener('touchstart', handleNodeInteraction);
        }
    }

    function createNodeElement(id, x, y) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'node';
        nodeElement.id = id;
        nodeElement.innerText = id;
        nodeElement.style.left = `${x - 25}px`;
        nodeElement.style.top = `${y - 25}px`;
        return nodeElement;
    }

    // Unified event handler for mousedown and touchstart on a node
    function handleNodeInteraction(e) {
        if (mode === 'add-edge') {
            e.stopPropagation(); // Prevent the container click/touch event from firing
            e.preventDefault(); // Prevent default touch behavior
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

    // Unified event handler for mousemove and touchmove
    graphContainer.addEventListener('mousemove', handleDrawing);
    graphContainer.addEventListener('touchmove', handleDrawing);

    function handleDrawing(e) {
        if (isDrawing && tempEdge) {
            e.preventDefault();
            const containerRect = graphContainer.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            const mouseX = clientX - containerRect.left;
            const mouseY = clientY - containerRect.top;
            tempEdge.setAttribute('x2', mouseX);
            tempEdge.setAttribute('y2', mouseY);
        }
    }

    // Unified event handler for mouseup and touchend
    graphContainer.addEventListener('mouseup', handleDrawingEnd);
    graphContainer.addEventListener('touchend', handleDrawingEnd);

    function handleDrawingEnd(e) {
        if (isDrawing) {
            e.preventDefault();
            isDrawing = false;
            
            if (tempEdge) {
                tempEdge.remove();
                tempEdge = null;
            }

            // Find the node element at the end of the interaction
            const endNodeElement = document.elementFromPoint(e.clientX || e.changedTouches[0].clientX, e.clientY || e.changedTouches[0].clientY);
            
            if (endNodeElement && endNodeElement.closest('.node') && endNodeElement.closest('.node').id !== startNodeForEdge) {
                const finalEndNodeElement = endNodeElement.closest('.node');
                const endNodeId = finalEndNodeElement.id;
                
                // Check if edge already exists
                if (!graph[startNodeForEdge].includes(endNodeId)) {
                    // Add edge to graph data
                    graph[startNodeForEdge].push(endNodeId);
                    graph[endNodeId].push(startNodeForEdge); // For an undirected graph

                    // Draw the permanent edge
                    let svg = graphContainer.querySelector('svg');
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    const startNodePos = { x: nodeElements[startNodeForEdge].offsetLeft + 25, y: nodeElements[startNodeForEdge].offsetTop + 25 };
                    const endNodePos = { x: finalEndNodeElement.offsetLeft + 25, y: finalEndNodeElement.offsetTop + 25 };

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
    }

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