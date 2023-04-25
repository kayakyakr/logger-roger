describe("fetchLogFromLoggerator", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    const batch1Data = `165.76.41.247 - markbutler [02/Jul/2000 07:01:19 +0000] "PUT /bookmarks/281 HTTP/1.0" 403 494
214.93.206.91 - jeremymoral`
    const batch2Data = `es [08/Jul/2000 11:58:39 +0000] "PUT /followers/111 HTTP/1.0" 403 547`

    it('should combine the leftovers from successive batches', async () => {
        const createLogs = vi.fn();
        vi.doMock('child_process', () => ({
            default: {
                spawn: vi.fn(() => ({
                    stdout: {
                        on: vi.fn((_event, callback) => {
                            let readableStream = {
                                toString: vi.fn(() => batch1Data)
                            }
                            callback(readableStream)
                            expect(createLogs).toBeCalledWith([
                                {
                                    ip: '165.76.41.247', 
                                    user: 'markbutler', 
                                    date: '02/Jul/2000 07:01:19 +0000', 
                                    method: 'PUT', 
                                    path: '/bookmarks/281', 
                                    protocol: 'HTTP/1.0', 
                                    status: '403', 
                                    size: '494'
                                }
                            ])
                            
                            createLogs.mockClear()
                            readableStream = {
                                toString: vi.fn(() => batch2Data)
                            }
                            callback(readableStream)
                            expect(createLogs).toBeCalledWith([
                                {
                                    ip: '214.93.206.91', 
                                    user: 'jeremymorales', 
                                    date: '08/Jul/2000 11:58:39 +0000', 
                                    method: 'PUT', 
                                    path: '/followers/111', 
                                    protocol: 'HTTP/1.0', 
                                    status: '403', 
                                    size: '547'
                                }
                            ])
                        })
                    }
                }))
            }
        }))

        vi.doMock('~/models/log.server', async () => {
            return {
                createLogs
            }
        })
        const { default: fetchLogFromLoggerator } = await import("./fetchLog.server")

        fetchLogFromLoggerator()
        
    })
})

describe("parseLog", () => {
    it('parses expected value into Log object', async () => {
        const { parseLog } = await import('./fetchLog.server')
        expect(parseLog(`165.76.41.247 - markbutler [02/Jul/2000 07:01:19 +0000] "PUT /bookmarks/281 HTTP/1.0" 403 494`)).toStrictEqual(
            {
                ip: '165.76.41.247', 
                user: 'markbutler', 
                date: '02/Jul/2000 07:01:19 +0000', 
                method: 'PUT', 
                path: '/bookmarks/281', 
                protocol: 'HTTP/1.0', 
                status: '403', 
                size: '494'
            }
        )
    })
    it('does not parse partial data', async () => {
        const { parseLog } = await import('./fetchLog.server')
        expect(parseLog(`165.76.41.247 - markbutler [02/Jul/2000 07:01:19 +0000] "PUT /bookmarks/281 HTTP/`)).toBeNull()
    })
    it('does not parse deformed data', async () => {
        const { parseLog } = await import('./fetchLog.server')
        expect(parseLog(`214.93.206.91  [08/Jul/2000 11:58:39 +0000] "PUT /followers/111 HTTP/1.0" 403 547`)).toBeNull()
    })
    it('does not parse non-matching data', async () => {
        const { parseLog } = await import('./fetchLog.server')
        expect(parseLog(`superb owl`)).toBeNull()
    })
    it('parses data that matches the format, even it is silly', async () => {
        const { parseLog } = await import('./fetchLog.server')
        // this is an intentional edge case that could be resolved with a more complete regex
        expect(parseLog(`a - b [c] "d e f" 1 2`)).toStrictEqual(
            {
                ip: 'a', 
                user: 'b', 
                date: 'c', 
                method: 'd', 
                path: 'e', 
                protocol: 'f', 
                status: '1', 
                size: '2'
            }
        )
    })
})