import type { ArgumentsHost } from '@nestjs/common';
import { ApplicationExceptionFilter } from './application-exception.filter';
import { ApplicationError } from '../errors/application.error';

class TestApplicationError extends ApplicationError {
  readonly code = 'TEST_ERROR';
  readonly statusCode = 400;

  constructor(message = 'Test error occurred') {
    super(message);
  }
}

describe('ApplicationExceptionFilter', () => {
  let filter: ApplicationExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ApplicationExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          status: mockStatus,
        }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should transform ApplicationError into structured JSON HTTP response', () => {
    const error = new TestApplicationError('Custom message');

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'TEST_ERROR',
      message: 'Custom message',
    });
  });
});
