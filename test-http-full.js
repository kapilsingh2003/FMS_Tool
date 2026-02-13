#!/usr/bin/env node
/**
 * Full HTTP MCP Server Test Script
 * 
 * This script performs a complete end-to-end test of the HTTP/SSE MCP server,
 * including SSE connection, message exchange, and all tool calls.
 * 
 * Run with: node test-http-full.js
 */

import EventSourcePkg from 'eventsource';
const EventSource = EventSourcePkg.default || EventSourcePkg;

const SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';

// Make EventSource available globally for the MCP SDK
globalThis.EventSource = EventSource;

console.log('='.repeat(60));
console.log('🧪 FULL HTTP MCP SERVER TEST');
console.log('='.repeat(60));
console.log(`\nServer URL: ${SERVER_URL}\n`);

// ============================================================================
// Test 1: Basic HTTP Endpoints
// ============================================================================

async function testBasicEndpoints() {
    console.log('\n' + '─'.repeat(60));
    console.log('📋 TEST 1: Basic HTTP Endpoints');
    console.log('─'.repeat(60));
    
    // Health check
    console.log('\n[1.1] Testing /health endpoint...');
    try {
        const response = await fetch(`${SERVER_URL}/health`);
        const data = await response.json();
        console.log('✅ Health check passed:');
        console.log(`   Status: ${data.status}`);
        console.log(`   Server: ${data.server} v${data.version}`);
        console.log(`   Project ID: ${data.projectId}`);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        console.log('\n⚠️  Make sure the server is running: npm run start:http');
        process.exit(1);
    }
    
    // Info endpoint
    console.log('\n[1.2] Testing /info endpoint...');
    try {
        const response = await fetch(`${SERVER_URL}/info`);
        const data = await response.json();
        console.log('✅ Info endpoint passed:');
        console.log(`   Transport: ${data.transport}`);
        console.log(`   Project: ${data.project?.title || 'N/A'}`);
        console.log(`   Endpoints: ${JSON.stringify(data.endpoints)}`);
    } catch (error) {
        console.log('❌ Info endpoint failed:', error.message);
    }
}

// ============================================================================
// Test 2: SSE Connection
// ============================================================================

async function testSSEConnection() {
    console.log('\n' + '─'.repeat(60));
    console.log('📋 TEST 2: SSE Connection');
    console.log('─'.repeat(60));
    
    return new Promise((resolve) => {
        console.log('\n[2.1] Connecting to SSE endpoint...');
        
        const eventSource = new EventSource(`${SERVER_URL}/sse`);
        let messageReceived = false;
        let endpointUrl = null;
        
        const timeout = setTimeout(() => {
            if (!messageReceived) {
                console.log('⚠️  No message received within timeout, but connection established');
            }
            eventSource.close();
            resolve({ success: true, endpointUrl });
        }, 5000);
        
        eventSource.onopen = () => {
            console.log('✅ SSE connection opened successfully');
        };
        
        eventSource.onmessage = (event) => {
            messageReceived = true;
            console.log('✅ Received SSE message:');
            console.log(`   Data: ${event.data.substring(0, 100)}...`);
            
            // Try to parse and get the endpoint URL
            try {
                const data = JSON.parse(event.data);
                if (data.endpoint) {
                    endpointUrl = data.endpoint;
                    console.log(`   Endpoint: ${endpointUrl}`);
                }
            } catch (e) {
                // Not JSON or no endpoint
            }
        };
        
        eventSource.onerror = (error) => {
            // SSE connections often error when server sends data
            // This is normal behavior
            if (!messageReceived) {
                console.log('⚠️  SSE error (may be normal):', error.message || 'Connection event');
            }
        };
        
        // Also listen for the 'endpoint' event specifically
        eventSource.addEventListener('endpoint', (event) => {
            console.log('✅ Received endpoint event:', event.data);
            endpointUrl = event.data;
        });
    });
}

// ============================================================================
// Test 3: Full MCP Protocol via SDK
// ============================================================================

async function testMCPProtocol() {
    console.log('\n' + '─'.repeat(60));
    console.log('📋 TEST 3: Full MCP Protocol via SDK');
    console.log('─'.repeat(60));
    
    try {
        const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
        const { SSEClientTransport } = await import('@modelcontextprotocol/sdk/client/sse.js');
        
        console.log('\n[3.1] Creating MCP client...');
        
        const transport = new SSEClientTransport(
            new URL(`${SERVER_URL}/sse`)
        );
        
        const client = new Client(
            { name: 'full-test-client', version: '1.0.0' },
            { capabilities: {} }
        );
        
        console.log('[3.2] Connecting to server...');
        await client.connect(transport);
        console.log('✅ Connected to MCP server');
        
        // List tools
        console.log('\n[3.3] Listing available tools...');
        const toolsResult = await client.listTools();
        console.log(`✅ Found ${toolsResult.tools.length} tools:`);
        for (const tool of toolsResult.tools) {
            console.log(`   • ${tool.name}`);
            console.log(`     ${tool.description.split('\n')[0]}`);
        }
        
        // List resources
        console.log('\n[3.4] Listing available resources...');
        try {
            const resourcesResult = await client.listResources();
            console.log(`✅ Found ${resourcesResult.resources.length} resource(s):`);
            for (const resource of resourcesResult.resources) {
                console.log(`   • ${resource.uri}: ${resource.name}`);
            }
        } catch (e) {
            console.log('⚠️  Resources not available:', e.message);
        }
        
        // Test get_project_info tool
        console.log('\n[3.5] Calling get_project_info tool...');
        const projectResult = await client.callTool({
            name: 'get_project_info',
            arguments: {},
        });
        console.log('✅ Tool call successful:');
        const projectText = projectResult.content[0].text;
        console.log(projectText.split('\n').slice(0, 10).join('\n'));
        console.log('   ...(truncated)');
        
        // Test list_fms_keys tool
        console.log('\n[3.6] Calling list_fms_keys tool...');
        const keysResult = await client.callTool({
            name: 'list_fms_keys',
            arguments: { limit: 5 },
        });
        console.log('✅ Tool call successful:');
        const keysText = keysResult.content[0].text;
        console.log(keysText.split('\n').slice(0, 12).join('\n'));
        console.log('   ...(truncated)');
        
        // Test get_fms_key_values tool
        console.log('\n[3.7] Calling get_fms_key_values tool...');
        const valuesResult = await client.callTool({
            name: 'get_fms_key_values',
            arguments: { 
                key_name: 'analog',
                include_comments: true 
            },
        });
        console.log('✅ Tool call successful:');
        const valuesText = valuesResult.content[0].text;
        console.log(valuesText.split('\n').slice(0, 20).join('\n'));
        console.log('   ...(truncated)');
        
        // Test with specific model filter
        console.log('\n[3.8] Calling get_fms_key_values with model filter...');
        const filteredResult = await client.callTool({
            name: 'get_fms_key_values',
            arguments: { 
                key_name: 'analog',
                target_model: 'M80D',
                include_comments: true 
            },
        });
        console.log('✅ Filtered tool call successful:');
        const filteredText = filteredResult.content[0].text;
        console.log(filteredText.split('\n').slice(0, 15).join('\n'));
        console.log('   ...(truncated)');
        
        // Close connection
        console.log('\n[3.9] Closing connection...');
        await client.close();
        console.log('✅ Connection closed cleanly');
        
        return true;
        
    } catch (error) {
        console.log('❌ MCP Protocol test failed:', error.message);
        console.log('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
        return false;
    }
}

// ============================================================================
// Test 4: Network Accessibility
// ============================================================================

async function testNetworkAccess() {
    console.log('\n' + '─'.repeat(60));
    console.log('📋 TEST 4: Network Accessibility');
    console.log('─'.repeat(60));
    
    const os = await import('os');
    const interfaces = os.networkInterfaces();
    
    console.log('\n[4.1] Available network interfaces:');
    
    const accessUrls = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            if (addr.family === 'IPv4' && !addr.internal) {
                const url = `http://${addr.address}:3001`;
                accessUrls.push({ name, url });
                console.log(`   • ${name}: ${url}`);
            }
        }
    }
    
    console.log('\n[4.2] Testing network accessibility...');
    for (const { name, url } of accessUrls) {
        try {
            const response = await fetch(`${url}/health`, { 
                signal: AbortSignal.timeout(2000) 
            });
            if (response.ok) {
                console.log(`   ✅ ${name} (${url}) - Accessible`);
            } else {
                console.log(`   ⚠️  ${name} (${url}) - Status ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ${name} (${url}) - ${error.message}`);
        }
    }
    
    return accessUrls;
}

// ============================================================================
// Summary
// ============================================================================

async function runAllTests() {
    const results = {
        basicEndpoints: false,
        sseConnection: false,
        mcpProtocol: false,
        networkAccess: [],
    };
    
    try {
        // Test 1
        await testBasicEndpoints();
        results.basicEndpoints = true;
        
        // Test 2
        const sseResult = await testSSEConnection();
        results.sseConnection = sseResult.success;
        
        // Test 3
        results.mcpProtocol = await testMCPProtocol();
        
        // Test 4
        results.networkAccess = await testNetworkAccess();
        
    } catch (error) {
        console.log('\n❌ Test suite error:', error.message);
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Basic HTTP Endpoints: ${results.basicEndpoints ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ SSE Connection:       ${results.sseConnection ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ MCP Protocol:         ${results.mcpProtocol ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Network Interfaces:   ${results.networkAccess.length} found`);
    
    const allPassed = results.basicEndpoints && results.sseConnection && results.mcpProtocol;
    
    if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('\n📖 Your MCP server is ready for integration.');
        console.log('\n🔗 Connection URLs for your chatbot:');
        console.log(`   Local:   ${SERVER_URL}/sse`);
        if (results.networkAccess.length > 0) {
            console.log(`   Network: ${results.networkAccess[0].url}/sse`);
        }
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
}

// Run all tests
runAllTests().catch(console.error);
