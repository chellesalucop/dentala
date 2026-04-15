<?php

namespace App\Services;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use ReflectionObject;
use ReflectionProperty;

class BrevoApiMailer
{
    public function sendMailable(string $recipientEmail, Mailable $mailable, ?string $recipientName = null): void
    {
        if (method_exists($mailable, 'build')) {
            $mailable->build();
        }

        $subject = $this->resolveSubject($mailable);
        $htmlContent = $mailable->render();
        $textContent = trim(html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />'], PHP_EOL, $htmlContent))));

        $this->sendEmail($recipientEmail, $subject, $htmlContent, $recipientName, $textContent);
    }

    public function sendEmail(
        string $recipientEmail,
        string $subject,
        string $htmlContent,
        ?string $recipientName = null,
        ?string $textContent = null
    ): void {
        $apiKey = (string) config('services.brevo.key');

        if ($apiKey === '') {
            throw new RuntimeException('Brevo API key is not configured.');
        }

        $fromAddress = (string) config('services.brevo.from.address', config('mail.from.address'));
        $fromName = (string) config('services.brevo.from.name', config('mail.from.name'));

        if ($fromAddress === '') {
            throw new RuntimeException('Brevo sender address is not configured.');
        }

        $payload = [
            'sender' => [
                'email' => $fromAddress,
                'name' => $fromName,
            ],
            'to' => [[
                'email' => $recipientEmail,
                'name' => $recipientName,
            ]],
            'subject' => $subject,
            'htmlContent' => $htmlContent,
        ];

        if ($textContent) {
            $payload['textContent'] = $textContent;
        }

        $response = Http::withHeaders([
            'accept' => 'application/json',
            'api-key' => $apiKey,
        ])
            ->timeout((int) config('services.brevo.timeout', 10))
            ->post(rtrim((string) config('services.brevo.base_url', 'https://api.brevo.com/v3'), '/') . '/smtp/email', $payload);

        if ($response->failed()) {
            throw new RuntimeException(sprintf(
                'Brevo API request failed with status %s: %s',
                $response->status(),
                $response->body()
            ));
        }
    }

    private function resolveSubject(Mailable $mailable): string
    {
        if (method_exists($mailable, 'envelope')) {
            try {
                $envelope = $mailable->envelope();

                if ($envelope?->subject) {
                    return $envelope->subject;
                }
            } catch (\Throwable) {
                // Fall back to the built subject for legacy mailables.
            }
        }

        $subject = $this->readProperty($mailable, 'subject');

        return is_string($subject) && $subject !== '' ? $subject : 'Dentala Notification';
    }

    private function readProperty(object $object, string $property): mixed
    {
        $reflection = new ReflectionObject($object);

        while ($reflection) {
            if ($reflection->hasProperty($property)) {
                $reflectionProperty = $reflection->getProperty($property);
                $reflectionProperty->setAccessible(true);

                return $reflectionProperty->getValue($object);
            }

            $reflection = $reflection->getParentClass();
        }

        return null;
    }
}