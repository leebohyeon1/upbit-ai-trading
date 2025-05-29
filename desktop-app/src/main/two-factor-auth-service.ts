import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface TwoFactorConfig {
  secret?: string;
  isEnabled: boolean;
  backupCodes?: string[];
  setupComplete: boolean;
}

export class TwoFactorAuthService {
  private configPath: string;
  private config: TwoFactorConfig = {
    isEnabled: false,
    setupComplete: false
  };

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.configPath = path.join(dataDir, '2fa-config.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(data);
      } else {
        this.config = {
          isEnabled: false,
          setupComplete: false
        };
      }
    } catch (error) {
      console.error('2FA 설정 로드 실패:', error);
      this.config = {
        isEnabled: false,
        setupComplete: false
      };
    }
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('2FA 설정 저장 실패:', error);
      throw new Error('2FA 설정을 저장할 수 없습니다.');
    }
  }

  /**
   * Base32 인코딩 (RFC 3548)
   */
  private base32Encode(buffer: Buffer): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        result += chars[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += chars[(value << (5 - bits)) & 31];
    }

    return result;
  }

  /**
   * Base32 디코딩
   */
  private base32Decode(encoded: string): Buffer {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = Buffer.alloc(Math.ceil(encoded.length * 5 / 8));

    for (let i = 0; i < encoded.length; i++) {
      const char = encoded[i].toUpperCase();
      const charIndex = chars.indexOf(char);
      
      if (charIndex === -1) continue;

      value = (value << 5) | charIndex;
      bits += 5;

      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }

    return output.subarray(0, index);
  }

  /**
   * TOTP 계산 (RFC 6238)
   */
  private generateTOTP(secret: string, timeStep: number = 30, digits: number = 6): string {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(Math.floor(time / 0x100000000), 0);
    timeBuffer.writeUInt32BE(time & 0xffffffff, 4);

    const secretBuffer = this.base32Decode(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const truncated = ((hash[offset] & 0x7f) << 24) |
                     ((hash[offset + 1] & 0xff) << 16) |
                     ((hash[offset + 2] & 0xff) << 8) |
                     (hash[offset + 3] & 0xff);

    const otp = truncated % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  }

  /**
   * 새로운 시크릿 키 생성
   */
  generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  /**
   * QR 코드용 URI 생성
   */
  generateQRUri(secret: string, accountName: string = 'Upbit AI Trading'): string {
    const issuer = 'Upbit AI Trading';
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * 백업 코드 생성
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
  }

  /**
   * 2FA 설정 초기화
   */
  async setup(): Promise<{ secret: string; qrUri: string; backupCodes: string[] }> {
    const secret = this.generateSecret();
    const qrUri = this.generateQRUri(secret);
    const backupCodes = this.generateBackupCodes();

    this.config = {
      secret,
      isEnabled: false, // 검증 후 활성화
      backupCodes,
      setupComplete: false
    };

    this.saveConfig();

    return { secret, qrUri, backupCodes };
  }

  /**
   * 2FA 활성화 (설정 검증 후)
   */
  async enable(token: string): Promise<boolean> {
    if (!this.config.secret) {
      throw new Error('2FA가 설정되지 않았습니다. 먼저 설정을 완료해주세요.');
    }

    if (this.verifyToken(token)) {
      this.config.isEnabled = true;
      this.config.setupComplete = true;
      this.saveConfig();
      return true;
    }

    return false;
  }

  /**
   * 2FA 비활성화
   */
  async disable(token: string): Promise<boolean> {
    if (!this.config.isEnabled) {
      return true;
    }

    if (this.verifyToken(token) || this.verifyBackupCode(token)) {
      this.config.isEnabled = false;
      this.saveConfig();
      return true;
    }

    return false;
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string): boolean {
    if (!this.config.secret || !this.config.isEnabled) {
      return false;
    }

    // 현재 시간과 이전/다음 시간 윈도우에서 검증 (클럭 스큐 허용)
    const timeSteps = [-1, 0, 1];
    
    for (const step of timeSteps) {
      const time = Math.floor(Date.now() / 1000 / 30) + step;
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(Math.floor(time / 0x100000000), 0);
      timeBuffer.writeUInt32BE(time & 0xffffffff, 4);

      const secretBuffer = this.base32Decode(this.config.secret);
      const hmac = crypto.createHmac('sha1', secretBuffer);
      hmac.update(timeBuffer);
      const hash = hmac.digest();

      const offset = hash[hash.length - 1] & 0xf;
      const truncated = ((hash[offset] & 0x7f) << 24) |
                       ((hash[offset + 1] & 0xff) << 16) |
                       ((hash[offset + 2] & 0xff) << 8) |
                       (hash[offset + 3] & 0xff);

      const otp = truncated % 1000000;
      const expectedToken = otp.toString().padStart(6, '0');

      if (token === expectedToken) {
        return true;
      }
    }

    return false;
  }

  /**
   * 백업 코드 검증
   */
  verifyBackupCode(code: string): boolean {
    if (!this.config.backupCodes || !this.config.isEnabled) {
      return false;
    }

    const index = this.config.backupCodes.indexOf(code.toUpperCase());
    if (index !== -1) {
      // 사용된 백업 코드 제거
      this.config.backupCodes.splice(index, 1);
      this.saveConfig();
      return true;
    }

    return false;
  }

  /**
   * 2FA 인증 (로그인 시 사용)
   */
  async authenticate(token: string): Promise<boolean> {
    if (!this.config.isEnabled) {
      return true; // 2FA가 비활성화된 경우 통과
    }

    return this.verifyToken(token) || this.verifyBackupCode(token);
  }

  /**
   * 2FA 상태 확인
   */
  getStatus(): { isEnabled: boolean; setupComplete: boolean; backupCodesRemaining: number } {
    return {
      isEnabled: this.config.isEnabled,
      setupComplete: this.config.setupComplete,
      backupCodesRemaining: this.config.backupCodes?.length || 0
    };
  }

  /**
   * 백업 코드 재생성
   */
  async regenerateBackupCodes(token: string): Promise<string[]> {
    if (!this.verifyToken(token)) {
      throw new Error('잘못된 인증 코드입니다.');
    }

    const newBackupCodes = this.generateBackupCodes();
    this.config.backupCodes = newBackupCodes;
    this.saveConfig();

    return newBackupCodes;
  }

  /**
   * 2FA 완전 재설정
   */
  async reset(): Promise<void> {
    this.config = {
      isEnabled: false,
      setupComplete: false
    };
    this.saveConfig();
  }
}