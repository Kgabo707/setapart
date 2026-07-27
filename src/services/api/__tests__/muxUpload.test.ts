import { createMuxUpload, getMuxUploadStatus } from '../muxUpload';

/**
 * The test environment has no Firebase credentials (same as demo mode), so these
 * should fail loudly and immediately rather than pretending to succeed — there is
 * nowhere for a real upload to go without a configured project.
 */
describe('Mux upload client in demo mode', () => {
  it('createMuxUpload refuses with a clear message', async () => {
    await expect(createMuxUpload()).rejects.toThrow(/configured Firebase project/);
  });

  it('getMuxUploadStatus refuses with a clear message', async () => {
    await expect(getMuxUploadStatus('upload-123')).rejects.toThrow(/configured Firebase project/);
  });
});
